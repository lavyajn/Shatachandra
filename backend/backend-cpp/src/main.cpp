#include <iostream>
#include <thread>
#include <chrono>

// Strictly following your folder structure
#include "../include/core/graph.h"
#include "../include/engine/physics.h"
#include "../include/engine/defense.h"
#include "../include/network/zmq_pub.h"

// Helper function to build the initial city grid
GridGraph initialize_world() {
    GridGraph graph;
    
    // Create 5 Nodes: {id, current_load, max_capacity, trust_score, incoming_packets, anomaly_strikes, status}
    graph.nodes = {
        {0, 20.0f, 100.0f, 100.0f, 0, 0, NodeStatus::NORMAL}, // Main Generator
        {1, 30.0f, 80.0f,  100.0f, 0, 0, NodeStatus::NORMAL}, // Substation A
        {2, 40.0f, 90.0f,  100.0f, 0, 0, NodeStatus::NORMAL}, // Node C (City - The Target)
        {3, 15.0f, 50.0f,  100.0f, 0, 0, NodeStatus::NORMAL}, // Edge Router
        {4, 35.0f, 85.0f,  100.0f, 0, 0, NodeStatus::NORMAL}  // Industrial Hub
    };

    // Create Edges: {id, source, target, current_flow, max_flow, is_active}
    graph.edges = {
        {0, 0, 1, 10.0f, 50.0f, true}, // Gen to Sub A
        {1, 1, 2, 20.0f, 60.0f, true}, // Sub A to City
        {2, 2, 3, 10.0f, 30.0f, true}, // City to Edge
        {3, 1, 4, 15.0f, 40.0f, true}  // Sub A to Industrial
    };

    return graph;
}

int main() {
    std::cout << "========================================\n";
    std::cout << " SHATACHANDRA PREDICTIVE ENGINE STARTING \n";
    std::cout << "========================================\n";

    // 1. Setup the World
    GridGraph live_graph = initialize_world();
    
    // 2. Setup the ZMQ Firehose
    TelemetryPublisher publisher;

    uint64_t tick_counter = 0;
    std::string current_decision = "System Stable. Monitoring packet flow.";

    // 3. The Infinite Game Loop
    while (true) {
        tick_counter++;

        // --- SIMULATE NORMAL TRAFFIC ---
        for (auto& node : live_graph.nodes) {
            if (node.status != NodeStatus::ISOLATED) {
                // Baseline ping traffic
                node.incoming_packets += 5; 
            }
        }

        // --- THE SCRIPTED HACKATHON DEMO TIMELINE ---
        // At exactly tick 100, we slam Node 2 (City Hub) with a DDoS / False Data Injection
        if (tick_counter > 100 && tick_counter < 120) {
            if (tick_counter == 101) {
                std::cout << "\n[EVENT] INJECTING MASSIVE ANOMALY AT NODE 2...\n";
                current_decision = "CRITICAL: Malicious spike detected at Node 2!";
            }
            // 800 packets per tick will immediately trigger the defense engine's 500 threshold
            live_graph.nodes[2].incoming_packets += 800; 
        }

        // --- EXECUTE CORE ENGINE PIPELINE ---
        
        // Step A: Detect anomalies and predict t+1 (This runs the Shadow Graphs)
        DefenseEngine::evaluate_and_defend(live_graph, current_decision);
        
        // Step B: Apply physical consequences (Calculates load limits and cascades)
        PhysicsEngine::tick(live_graph, 0.1f);
        
        // Step C: Broadcast the current state to Node.js / React
        publisher.broadcast_state(live_graph, current_decision);

        // --- PACING ---
        // Sleep for 100 milliseconds (10 Ticks per second).
        // This makes the UI animations smooth and allows judges to actually see the numbers change.
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    return 0;
}