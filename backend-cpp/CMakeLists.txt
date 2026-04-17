cmake_minimum_required(VERSION 3.14)
project(ShatachandraEngine)

set(CMAKE_CXX_STANDARD 17)

# 1. Tell CMake to fetch dependencies directly from GitHub
include(FetchContent)

# Fetch the core ZeroMQ C library (BUMPED TO v4.3.5 TO FIX GCC 13 BUG)
FetchContent_Declare(
    libzmq
    GIT_REPOSITORY https://github.com/zeromq/libzmq.git
    GIT_TAG        v4.3.5
)
set(ZMQ_BUILD_TESTS OFF CACHE BOOL "Disable tests" FORCE)
set(WITH_PERF_TOOL OFF CACHE BOOL "Disable perf tools" FORCE)
FetchContent_MakeAvailable(libzmq)

# Fetch the C++ wrapper (BUMPED TO v4.10.0)
FetchContent_Declare(
    cppzmq
    GIT_REPOSITORY https://github.com/zeromq/cppzmq.git
    GIT_TAG        v4.10.0
)
set(CPPZMQ_BUILD_TESTS OFF CACHE BOOL "Disable tests" FORCE)
FetchContent_MakeAvailable(cppzmq)

# 2. Build your engine
add_executable(shatachandra src/main.cpp)

# 3. Link the downloaded ZeroMQ targets to your engine
target_link_libraries(shatachandra PRIVATE libzmq cppzmq)