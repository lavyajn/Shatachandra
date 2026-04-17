#include <iostream>
#include <thread>
#include <chrono>
#include <string>
#include <zmq.hpp> // Ensure cppzmq is available via CMake

#include "../include/core/graph.h"
#include "../include/engine/physics.h"
#include "../include/engine/defense.h"
#include "../include/network/zmq_pub.h"

// Helper function to build the initial city grid
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
    TelemetryPublisher publisher;

    // 1. Setup Command Subscriber to listen to the Node.js Bridge
    zmq::context_t context(1);
    zmq::socket_t command_sub(context, zmq::socket_type::sub);
    command_sub.connect("tcp://127.0.0.1:5556"); 
    command_sub.set(zmq::sockopt::subscribe, "");

    bool is_attack_active = false;
    std::string active_scenario = "NONE";
    std::string current_decision = "System Stable. Monitoring packet flow.";
// Inside main.cpp loop
uint32_t target_id = 0; // Default target

while (true) {
    // --- A. COMMAND LISTENER (Non-blocking) ---
    zmq::message_t cmd_msg;
    if (command_sub.recv(cmd_msg, zmq::recv_flags::dontwait)) {
        std::string cmd_str(static_cast<char*>(cmd_msg.data()), cmd_msg.size());
        
        if (cmd_str == "STOP") {
            is_attack_active = false;
            active_scenario = "NONE";
            current_decision = "Attack Terminated. Normalizing System State.";
            
            // Restore trust scores for all non-isolated nodes
            for (auto& node : live_graph.nodes) {
                if (node.status != NodeStatus::ISOLATED) node.status = NodeStatus::NORMAL;
                node.trust_score = 100.0f;
            }
        } else if (cmd_str.find("START_") == 0) {
            // Parse "START_SCENARIO_ID" (e.g., START_DDOS_2)
            size_t first_und = cmd_str.find("_");
            size_t last_und = cmd_str.find_last_of("_");
            
            if (first_und != std::string::npos && last_und != std::string::npos && first_und != last_und) {
                active_scenario = cmd_str.substr(first_und + 1, last_und - first_und - 1);
                target_id = std::stoi(cmd_str.substr(last_und + 1));
                is_attack_active = true;
                current_decision = "SCENARIO: " + active_scenario + " INITIATED ON NODE " + std::to_string(target_id);
            }
        }
    }

    // --- B. BASELINE TRAFFIC (Always Runs) ---
    // This ensures the grid remains "alive" visually even without an attack.
    for (auto& node : live_graph.nodes) {
        if (node.status != NodeStatus::ISOLATED) {
            node.incoming_packets += 5;
        }
    }

    // --- C. CONDITIONAL ATTACK INJECTION (Dynamic Targeting) ---
    if (is_attack_active && target_id < live_graph.nodes.size()) {
        auto& target_node = live_graph.nodes[target_id];

        if (active_scenario == "DDOS") {
            // Threshold is 500, so +800 triggers the Defense Engine
            target_node.incoming_packets += 800;
        } else if (active_scenario == "SPOOFING") {
            // Directly decay trust to bypass packet filters
            target_node.trust_score -= 2.0f; 
        } else if (active_scenario == "FDI") {
            // Manually inflate load to trigger physical cascade
            target_node.current_load += 10.0f; 
        }
    }

    // --- D. EXECUTE CORE ENGINE PIPELINE ---
    // Detect anomalies and run shadow graph predictions
    DefenseEngine::evaluate_and_defend(live_graph, current_decision);
    
    // Apply physical consequences and potential load redistribution
    PhysicsEngine::tick(live_graph, 0.1f);
    
    // Broadcast the updated JSON state to the Node.js bridge
    publisher.broadcast_state(live_graph, current_decision);

    // Sleep for 100ms (10 ticks per second) for smooth UI feedback
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
}
    return 0;
}