#include <iostream>
#include <thread>
#include <chrono>
#include <string>
#include <zmq.hpp>

// Strictly following your folder structure
#include "../include/core/graph.h"
#include "../include/engine/physics.h"
#include "../include/engine/defense.h"

GridGraph initialize_world() {
    GridGraph graph;
    
    graph.nodes = {
        {0, 20.0f, 100.0f, 100.0f, 0, 0, NodeStatus::NORMAL}, 
        {1, 30.0f, 80.0f,  100.0f, 0, 0, NodeStatus::NORMAL}, 
        {2, 40.0f, 90.0f,  100.0f, 0, 0, NodeStatus::NORMAL}, 
        {3, 15.0f, 50.0f,  100.0f, 0, 0, NodeStatus::NORMAL}, 
        {4, 35.0f, 85.0f,  100.0f, 0, 0, NodeStatus::NORMAL}  
    };

    graph.edges = {
        {0, 0, 1, 10.0f, 50.0f, true}, 
        {1, 1, 2, 20.0f, 60.0f, true}, 
        {2, 2, 3, 10.0f, 30.0f, true}, 
        {3, 1, 4, 15.0f, 40.0f, true}  
    };

    return graph;
}

int main() {
    std::cout << "========================================\n";
    std::cout << " SHATACHANDRA PREDICTIVE ENGINE STARTING \n";
    std::cout << "========================================\n";

    GridGraph live_graph = initialize_world();
    zmq::context_t context(1);

    // 1. THE MOUTH: Raw Publisher on 5555 (Bypassing zmq_pub.h to guarantee JSON schema)
    zmq::socket_t publisher(context, ZMQ_PUB);
    publisher.bind("tcp://127.0.0.1:5555");

    // 2. THE EAR: Command Listener on 5556
    zmq::socket_t command_listener(context, ZMQ_SUB);
    command_listener.bind("tcp://127.0.0.1:5556");
    command_listener.set(zmq::sockopt::subscribe, "");

    uint64_t tick_counter = 0;
    std::string current_decision = "System Stable. Monitoring packet flow.";

    while (true) {
        tick_counter++;

        // --- 1. CHECK FOR EXTERNAL ATTACK COMMANDS ---
        zmq::message_t cmd_msg;
        if (command_listener.recv(cmd_msg, zmq::recv_flags::dontwait)) {
            std::string cmd(static_cast<char*>(cmd_msg.data()), cmd_msg.size());
            
            if (cmd.find("ATTACK:") == 0) {
                size_t first_colon = cmd.find(':');
                size_t second_colon = cmd.find(':', first_colon + 1);
                
                if (first_colon != std::string::npos && second_colon != std::string::npos) {
                    std::string type = cmd.substr(first_colon + 1, second_colon - first_colon - 1);
                    int target = std::stoi(cmd.substr(second_colon + 1));
                    
                    PhysicsEngine::inject_attack(live_graph, type, target);
                    current_decision = "CRITICAL: Malicious " + type + " signature detected at Node " + std::to_string(target) + "!";
                }
            }
        }

        // --- 2. SIMULATE NORMAL TRAFFIC ---
        for (auto& node : live_graph.nodes) {
            if (node.status != NodeStatus::ISOLATED) {
                node.incoming_packets += 5; 
            }
        }

        // --- 3. EXECUTE CORE ENGINE PIPELINE ---
        DefenseEngine::evaluate_and_defend(live_graph, current_decision);
        PhysicsEngine::tick(live_graph, 0.1f);

        // --- 4. EXPLICIT JSON SERIALIZATION ---
        // We write the exact string React is looking for to prevent undefined variables
        std::string payload = "{\"tick\": " + std::to_string(tick_counter) + 
                              ", \"decisionLog\": \"" + current_decision + "\"" + 
                              ", \"decision_log\": \"" + current_decision + "\", \"nodes\": [";
                              
        for (size_t i = 0; i < live_graph.nodes.size(); ++i) {
            payload += "{\"id\":" + std::to_string(live_graph.nodes[i].id) + 
                       ",\"load\":" + std::to_string(live_graph.nodes[i].current_load) + 
                       ",\"trust\":" + std::to_string(live_graph.nodes[i].trust_score) + 
                       ",\"status\":" + std::to_string(static_cast<int>(live_graph.nodes[i].status)) + "}";
            if (i < live_graph.nodes.size() - 1) payload += ",";
        }
        payload += "]}";

        zmq::message_t zmq_payload(payload.size());
        memcpy(zmq_payload.data(), payload.c_str(), payload.size());
        publisher.send(zmq_payload, zmq::send_flags::none);

        // --- PACING ---
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    return 0;
}