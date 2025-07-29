# Product Requirements Document: Traffic Light with Pedestrian Crossing

## Overview

The "traffic-light-extended" example demonstrates a traffic light system with pedestrian crossing capabilities. This example showcases how to implement a state machine using the matchina library for a real-world scenario with multiple actors (vehicles and pedestrians).

## Core Requirements

### Traffic Light States

1. **Green**: Normal traffic flow for vehicles
2. **Yellow**: Warning state before stopping vehicle traffic
3. **Red**: Vehicles stopped
4. **Red with Pedestrian Crossing**: Vehicles stopped BUT pedestrian has requested a crossing which will shorten the delay within some tolerance range.

### Pedestrian Interaction

1. Pedestrians can request to cross by pressing a button
2. The system will transition to allow pedestrian crossing at the next appropriate cycle
3. Pedestrian crossing shows WALK during green and then flashes Dontwalk 3s before red is supposed to hit, until red does hit. when red hits it shows DontWalk solid
4. The pedestrian crossing signal will have clear visual indication (white walk, flashing red don't walk, solid red don't walk)

### Timing & Transitions

1. **Green state**: Fixed duration (default: 5 seconds)
2. **Yellow state**: Fixed duration (default: 2 seconds)
3. **Red state**:
   - Without pedestrian request: Fixed duration (default: 4 seconds)
   - With pedestrian request: Transitions to red with pedestrian request
4. **Pedestrian Crossing**: Is defined by the states and the flashing timing logic

### State Machine Behavior

1. When a pedestrian presses the button during Green or Yellow, the request is stored
2. When/while Red state is reached, if a request is pending, enter Red with pedestrian crossing requested mode
   ~~3. If the button is pressed during Red (before pedestrian crossing starts), immediately enter crossing mode~~ NO!
3. Pedestrian crossing is entirely determined by states, and the view has logic for it to blink 3s before scheduled to go red
4. Clear pedestrian request after it has been fulfilled

## Implementation Guidelines

### State Machine Design

- Use minimal state definitions, leveraging matchina's pattern matching capabilities
- States should include only necessary properties (e.g., name, duration)
- Avoid storing UI-specific properties in the state (e.g., flashing logic)
- Use transitions for state changes
- Use lifecycle hooks for timing-based transitions
- In the view use a state effect to determine what to do about blinking

### View Implementation

- Clearly separate view logic from state machine logic
- Handle all visual effects in the view (e.g., flashing during pedestrian crossing)
- Use pattern matching to render different light configurations, or ternary like state.is('Red') ? 1 : 2
- Implement visual countdown for pedestrian crossing (if desired)
- Handle button interactions and pass events to the state machine

### Events

1. **Pedestrian Button Press**: `requestCrossing`
2. **Timer Completion**: Automatic transitions based on state durations

## Non-Requirements

- No need to implement complex traffic patterns or vehicle detection
- No need to implement accessible pedestrian signals (audio cues)
- No need to implement emergency vehicle preemption
- No need to implement different timing for different times of day

## User Experience

- Clear visual indication of current state
- Responsive button for pedestrian crossing requests
- Visual feedback when pedestrian crossing is requested
- Clear indication during pedestrian crossing
- Visual countdown or warning before pedestrian crossing ends

## Technical Constraints

- Use only the matchina library for state management
- Keep implementation minimal and focused on demonstrating library capabilities
- Ensure type safety throughout the implementation
- Follow idiomatic TypeScript practices
