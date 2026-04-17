#pragma once
#include "../core/graph.h"
#include <iostream>
#include <vector>

class PhysicsEngine {
public:
    // This runs continuously. 'dt' is delta time (e.g., 0.016s for 60Hz)
    static void tick(GridGraph& graph, float dt) {
        
        // STEP 1: Convert network traffic into physical load
        for (auto& node : graph.nodes) {
            if (node.status == NodeStatus::ISOLATED) continue;

            // Simple physics conversion: every X packets generates Y load
            float traffic_load = node.incoming_packets * 0.05f; 
            node.current_load += traffic_load;
            
            // Reset packets for the next tick (handled by the listener thread)
            node.incoming_packets = 0; 
        }

        // STEP 2: Evaluate physical failures & trigger cascades
        bool cascade_triggered = false;

        for (auto& node : graph.nodes) {
            if (node.status != NodeStatus::ISOLATED && node.current_load > node.max_capacity) {
                // The physical hardware has melted/tripped
                node.status = NodeStatus::ISOLATED;
                cascade_triggered = true;
                
                // STEP 3: Redistribute the load to adjacent nodes
                redistribute_load(graph, node);
            }
        }

        // Optional: If a cascade happened, we could immediately run another 
        // stabilization pass, but leaving it for the next tick is more realistic.
    }

private:
    // The Cascading Math
    static void redistribute_load(GridGraph& graph, Node& failed_node) {
        std::vector<uint32_t> active_neighbors;
        
        // Find all edges connected to this failed node
        for (auto& edge : graph.edges) {
            if (!edge.is_active) continue;

            if (edge.target_node_id == failed_node.id) {
                active_neighbors.push_back(edge.source_node_id);
                edge.is_active = false; // Sever the line
            }
        }

        if (active_neighbors.empty()) return;

        // Distribute the failed node's load equally among neighbors
        // Formula: L_neighbor = L_neighbor + (L_failed / N)
        float distributed_load = failed_node.current_load / active_neighbors.size();

        for (uint32_t neighbor_id : active_neighbors) {
            Node& neighbor = graph.getNode(neighbor_id);
            if (neighbor.status != NodeStatus::ISOLATED) {
                neighbor.current_load += distributed_load;
            }
        }

        // Zero out the failed node
        failed_node.current_load = 0;
    }
};