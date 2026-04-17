#pragma once
#include <vector>
#include "node.h"
// edge.h is implicitly included conceptually here

class GridGraph {
public:
    std::vector<Node> nodes;
    std::vector<Edge> edges;
    
    float total_system_load;

    // The most important function in your backend.
    // Because we used raw data types, this is a blazingly fast deep copy.
    GridGraph clone() const {
        return *this; 
    }

    // Quick helper to fetch a node by ID
    Node& getNode(uint32_t id) {
        // In a strictly indexed array, id == index. Zero search time O(1).
        return nodes[id];
    }
};