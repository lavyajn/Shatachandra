#pragma once
#include "../core/graph.h"
#include <iostream>

class PhysicsEngine {
public:
    static void tick(GridGraph& graph, float delta_time) {
        for (auto& node : graph.nodes) {
            if (node.status == NodeStatus::ISOLATED) continue;

            // 1. Define Baseline Load (Node 0 Generator vs Substations)
            float base_load = (node.id == 0) ? 20.0f : 30.0f;

            // 2. Convert Packets to Physical Load
            float traffic_load = node.incoming_packets * 0.05f;
            node.current_load += traffic_load;
            
            // Reset packets for the next tick
            node.incoming_packets = 0; 

            // 3. THE FIX: Natural Load Decay
            if (node.current_load > base_load) {
                node.current_load -= 1.5f; // Dissipate load 
                if (node.current_load < base_load) {
                    node.current_load = base_load; // Clamp to baseline
                }
            }

            // 4. Catastrophic Failure Check
            if (node.current_load > node.max_capacity) {
                node.status = NodeStatus::ISOLATED;
                node.current_load = 0.0f; // Trip the breaker
                std::cout << "[PHYSICS WARNING] Node " << node.id << " exceeded capacity and isolated!\n";
            }
        }
    }
};