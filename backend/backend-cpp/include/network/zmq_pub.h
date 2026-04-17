#pragma once
#include <zmq.hpp>
#include <string>
#include <iostream>
#include "../core/graph.h"

class TelemetryPublisher {
    zmq::context_t context;
    zmq::socket_t publisher;

public:
    // Initialize ZMQ Context and bind to port 5555
    TelemetryPublisher() : context(1), publisher(context, zmq::socket_type::pub) {
        publisher.bind("tcp://127.0.0.1:5555");
        std::cout << "[ZMQ] Telemetry Firehose active on tcp://127.0.0.1:5555\n";
    }

    // Call this at the end of every Physics Tick
    void broadcast_state(const GridGraph& graph, const std::string& latest_decision) {
        
        // Fast manual JSON construction
        std::string payload = "{\"nodes\":[";
        
        for (size_t i = 0; i < graph.nodes.size(); ++i) {
            const auto& n = graph.nodes[i];
            
            payload += "{\"id\":\"" + std::to_string(n.id) + "\",";
            payload += "\"load\":" + std::to_string(n.current_load) + ",";
            payload += "\"capacity\":" + std::to_string(n.max_capacity) + ",";
            payload += "\"trust\":" + std::to_string(n.trust_score) + ",";
            payload += "\"status\":" + std::to_string(static_cast<int>(n.status)) + "}";
            
            if (i < graph.nodes.size() - 1) payload += ",";
        }
        
        payload += "], \"decision_log\":\"" + latest_decision + "\"}";

        // Send over ZMQ
        zmq::message_t message(payload.size());
        memcpy(message.data(), payload.data(), payload.size());
        publisher.send(message, zmq::send_flags::none);
    }
};