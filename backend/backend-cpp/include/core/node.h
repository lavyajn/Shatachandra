#ifndef NODE_H
#define NODE_H

#include <cstdint>

enum class NodeStatus : uint8_t { 
    NORMAL = 0, 
    WARNING = 1, 
    COMPROMISED = 2, 
    ISOLATED = 3 
};

struct Node {
    uint32_t id;
    float current_load;
    float max_capacity;
    float trust_score;
    uint32_t incoming_packets;
    uint32_t anomaly_strikes;
    NodeStatus status;
};

// We moved this here since you deleted edge.h
struct Edge {
    uint32_t id;
    uint32_t source_node_id;
    uint32_t target_node_id;
    float current_flow;
    float max_flow_capacity;
    bool is_active;
};

#endif