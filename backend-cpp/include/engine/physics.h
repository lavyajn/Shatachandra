#pragma once
#include "../core/graph.h"
#include <iostream>
#include <vector>
#include <string>

class PhysicsEngine {
public:
    // --- NEW: RED TEAM ATTACK INJECTION ---
    static void inject_attack(GridGraph& graph, const std::string& attack_type, uint32_t target_node_id) {
        // Find the node. (Assuming graph.nodes is a std::vector and id matches index for simplicity)
        if (target_node_id >= graph.nodes.size()) return;
        
        Node& target = graph.nodes[target_node_id];

        if (attack_type == "DDOS") {
            std::cout << "\n[RED TEAM] Executing Volumetric DDoS on Node " << target_node_id << "...\n";
            target.incoming_packets += 150000;
            target.current_load += 500.0f; // Massive physical overload
        } 
        else if (attack_type == "FDI") {
            std::cout << "\n[RED TEAM] Executing False Data Injection on Node " << target_node_id << "...\n";
            target.trust_score = 0.0f; // Silent trust drain, load looks physically normal
        } 
        else if (attack_type == "SPOOF") {
            std::cout << "\n[RED TEAM] Executing Packet Spoofing on Node " << target_node_id << "...\n";
            target.status = NodeStatus::COMPROMISED; // Bypass physics, force a critical hardware state
        }
    }

    // --- EXISTING PHYSICS ENGINE ---
    static void tick(GridGraph& graph, float dt) {
        // STEP 1: Convert network traffic into physical load
        for (auto& node : graph.nodes) {
            if (node.status == NodeStatus::ISOLATED) continue;

            float traffic_load = node.incoming_packets * 0.05f; 
            node.current_load += traffic_load;
            node.current_load -= 0.25f; // Exactly offsets the baseline +5 packets
            if (node.current_load < 10.0f) node.current_load = 10.0f; // Prevent negative loads
            
            node.incoming_packets = 0;
        }

        // STEP 2: Evaluate physical failures & trigger cascades
        bool cascade_triggered = false;

        for (auto& node : graph.nodes) {
            if (node.status != NodeStatus::ISOLATED && node.current_load > node.max_capacity) {
                node.status = NodeStatus::ISOLATED;
                cascade_triggered = true;
                redistribute_load(graph, node);
            }
        }
    }

private:
    static void redistribute_load(GridGraph& graph, Node& failed_node) {
        std::vector<uint32_t> active_neighbors;
        
        for (auto& edge : graph.edges) {
            if (!edge.is_active) continue;

            if (edge.target_node_id == failed_node.id) {
                active_neighbors.push_back(edge.source_node_id);
                edge.is_active = false; 
            }
        }

        if (active_neighbors.empty()) return;

        float distributed_load = failed_node.current_load / active_neighbors.size();

        for (uint32_t neighbor_id : active_neighbors) {
            // Find neighbor by ID (assumes sequential IDs or requires a find function if not)
            for(auto& neighbor : graph.nodes) {
                if(neighbor.id == neighbor_id && neighbor.status != NodeStatus::ISOLATED) {
                    neighbor.current_load += distributed_load;
                    break;
                }
            }
        }

        failed_node.current_load = 0;
    }
};