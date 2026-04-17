#ifndef DEFENSE_H
#define DEFENSE_H
#include "../core/graph.h"
#include "physics.h"
#include <iostream>
#include <string>

class DefenseEngine {
public:
    static constexpr float TRUST_DECAY = 5.0f;
    static constexpr float CRITICAL_TRUST = 30.0f;
    static constexpr uint32_t DDOS_THRESHOLD = 500;

    // Added std::string& current_decision
    static void evaluate_and_defend(GridGraph& real_graph, std::string& current_decision) {
        
        for (auto& node : real_graph.nodes) {
            if (node.status == NodeStatus::ISOLATED) continue;

            if (node.incoming_packets > DDOS_THRESHOLD) {
                node.trust_score -= TRUST_DECAY;
                node.status = NodeStatus::WARNING;
                node.anomaly_strikes++;
            } else if (node.trust_score < 100.0f) {
                node.trust_score += 0.5f; 
                if (node.trust_score > 80.0f) node.status = NodeStatus::NORMAL;
            }

            if (node.trust_score <= CRITICAL_TRUST && node.status != NodeStatus::COMPROMISED) {
                node.status = NodeStatus::COMPROMISED;
                // Pass the string down to the decision maker
                execute_smart_defense(real_graph, node, current_decision); 
            }
        }
    }

private:
    // Added std::string& current_decision
    static void execute_smart_defense(GridGraph& real_graph, Node& threat_node, std::string& current_decision) {
        std::cout << "[DEFENSE] Threat detected at Node " << threat_node.id << ". Running predictions...\n";

        GridGraph shadow_A = real_graph.clone();
        Node& shadow_threat_A = shadow_A.getNode(threat_node.id);
        
        shadow_threat_A.status = NodeStatus::ISOLATED; 
        PhysicsEngine::tick(shadow_A, 0.016f); 

        bool cascade_predicted = false;
        for (const auto& node : shadow_A.nodes) {
            if (real_graph.getNode(node.id).status != NodeStatus::ISOLATED && 
                node.status == NodeStatus::ISOLATED) {
                cascade_predicted = true;
                break;
            }
        }

        // Update the string so it broadcasts to React!
        if (cascade_predicted) {
            std::string log = "[PREDICTION] Isolation will cause CASCADING FAILURE. Rejecting Action. [ACTION] Applying Rate Limiting to Node " + std::to_string(threat_node.id);
            std::cout << log << "\n";
            current_decision = log;
            
            threat_node.incoming_packets *= 0.2f; 
        } else {
            std::string log = "[PREDICTION] Isolation safe. No cascade detected. [ACTION] Isolating Node " + std::to_string(threat_node.id);
            std::cout << log << "\n";
            current_decision = log;
            
            threat_node.status = NodeStatus::ISOLATED;
            threat_node.current_load = 0;
        }
    }
};