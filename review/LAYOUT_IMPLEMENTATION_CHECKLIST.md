# Layout Engine Implementation Checklist

## 🚨 Phase 1: Fix What's Broken (Critical)

### 1.1 Fix Circular Layout ✅ COMPLETED
- [x] **Replace ELK radial with Graphviz circo**
  - [x] Add `org.eclipse.elk.graphviz.circo` to ELK algorithm enum
  - [x] Add Graphviz circo algorithm options to ELKLayoutEngine
  - [x] Update LayoutManager to map CIRCULAR to Graphviz circo
  - [x] Remove ELK radial workarounds (startAngle, clockwise deletion)
  - [x] Test circular layout with cyclic graphs
- [x] **Update documentation**
  - [x] Document Graphviz circo algorithm usage
  - [x] Update LAYOUT_ENGINE_ANALYSIS.md with circo information
  - [x] Remove references to broken ELK radial

### 1.2 Clarify Radial Layout
- [ ] **Determine radial layout approach**
  - [ ] Research radial tree requirements (single root?)
  - [ ] Test if radial works with proper tree structures
  - [ ] Decide: keep as "Radial Tree" or replace with twopi
- [ ] **Implement chosen approach**
  - [ ] If keeping radial: Add tree validation and clear naming
  - [ ] If replacing: Map to `graphviz.twopi` algorithm
  - [ ] Update UI labels and descriptions
- [ ] **Test radial layout behavior**
  - [ ] Test with proper tree structures
  - [ ] Test with non-tree structures (should fail gracefully)
  - [ ] Verify error messages are helpful

### 1.3 Complete Testing Coverage
- [ ] **Test Tree layout**
  - [ ] Test with hierarchical HSM data
  - [ ] Verify proper tree arrangement
  - [ ] Check edge label spacing
- [ ] **Test Force layout**
  - [ ] Test with flat traffic light data
  - [ ] Test with hierarchical HSM data
  - [ ] Verify force-directed behavior
- [ ] **Update analysis document**
  - [ ] Mark Tree/Force as verified or failed
  - [ ] Update LAYOUT_ENGINE_ANALYSIS.md
  - [ ] Document any issues found

### 1.4 Screenshot Automation Implementation ✅ COMPLETED
- [x] **Create screenshot automation script**
  - [x] Create `/scripts/capture-layout-screenshots.sh`
  - [x] Add batch capture functionality
  - [x] Include progress tracking and error handling
- [x] **Update documentation**
  - [x] Add automation section to AGENTS.md
  - [x] Update screenshot documentation with automation
  - [x] Create SCREENSHOT_AUTOMATION_NOTES.md
- [x] **Test automation**
  - [x] Verify Playwright CLI method works
  - [x] Test direct screenshot capture
  - [x] Confirm no copying required

### 1.5 URL-Based Visualizer Control ✅ COMPLETED
- [x] **Create URL-based control system**
  - [x] Design URL parameter structure (viz, layout, settings)
  - [x] Create URL builder utility
  - [x] Test URL-based navigation works
- [x] **Enhanced automation script**
  - [x] Create `/scripts/capture-enhanced-screenshots.sh`
  - [x] Add multiple capture modes (basic, presets, all)
  - [x] Add settings presets and custom configurations
  - [x] Add visualizer selection support
- [x] **Update documentation**
  - [x] Add URL-based control to AGENTS.md
  - [x] Update screenshot documentation with URL control
  - [x] Create URL_BASED_VISUALIZER_CONTROL.md
- [x] **Test URL control**
  - [x] Verify URL parameters work correctly
  - [x] Test screenshot capture via URL
  - [x] Confirm no manual interaction needed

### 1.6 Fast Example Gallery Capture ✅ COMPLETED
- [x] **Create fast gallery capture script**
  - [x] Create `/scripts/capture-example-gallery.sh`
  - [x] Capture all examples with defaults
  [x] Auto-generate markdown gallery documentation
- [x] **Optimize for speed**
  - [x] No layout switching - use defaults
  - [x] Minimal wait times between captures
  - [x] Fast visual overview generation
- [x] **Auto documentation**
  - [x] Generate `review/EXAMPLE_GALLERY.md`
  - [x] Include all examples with proper formatting
  [x] Add generation metadata and instructions
- [x] **Test gallery generation**
  - [x] Verify script captures all examples
  - [x] Test documentation generation
  - [x] Confirm gallery displays correctly
- [x] **Fix selector issues**
  - [x] Remove examples that don't use MachineVisualizer
  - [x] Fix visualizer container targeting
  - [x] Remove auto-zoom assumption
  [x] Add proper content rendering wait

## 🎯 Phase 2: Add Options & Flexibility (Important)

### 2.1 Add Graphviz Algorithm Support
- [ ] **Add remaining Graphviz algorithms**
  - [ ] Add `graphviz.twopi` options to ELKLayoutEngine
  - [ ] Add `graphviz.dot` options to ELKLayoutEngine
  - [ ] Add `graphviz.neato` and `graphviz.fdp` if needed
- [ ] **Create algorithm configuration system**
  - [ ] Design configurable algorithm mapping
  - [ ] Allow easy switching between algorithms
  - [ ] Support algorithm-specific settings
- [ ] **Test new algorithms**
  - [ ] Test twopi for radial tree layouts
  - [ ] Test dot as alternative to layered
  - [ ] Document each algorithm's characteristics

### 2.2 Configurable Layout Exposure
- [ ] **Design layout selection system**
  - [ ] Create configuration for which layouts to expose
  - [ ] Add layout metadata (description, use cases)
  - [ ] Implement dynamic layout option generation
- [ ] **Update UI components**
  - [ ] Make layout dropdown configurable
  - [ ] Add layout descriptions/help text
  - [ ] Support enabling/disabling specific layouts
- [ ] **Create layout registry**
  - [ ] Register available layouts with metadata
  - [ ] Support custom layout registration
  - [ ] Add layout capability flags (hierarchy, cycles, etc.)

### 2.3 Algorithm Experimentation Framework
- [ ] **Create algorithm testing interface**
  - [ ] Add developer mode for algorithm switching
  - [ ] Support runtime algorithm changes
  - [ ] Add algorithm comparison tools
- [ ] **Document algorithm capabilities**
  - [ ] Create algorithm comparison matrix
  - [ ] Document use cases for each algorithm
  - [ ] Add algorithm selection guidance

## ✨ Phase 3: Quality & Polish (Nice to Have)

### 3.1 Fine-tune Defaults & Settings
- [ ] **Optimize default spacing values**
  - [ ] Fine-tune edge label spacing (75-100% node width)
  - [ ] Optimize node spacing for each layout type
  - [ ] Adjust container padding values
- [ ] **Validate settings ranges**
  - [ ] Set sensible min/max for all parameters
  - [ ] Add settings validation with helpful errors
  - [ ] Test extreme values for robustness
- [ ] **Profile layout performance**
  - [ ] Measure layout calculation times
  - [ ] Optimize for large graphs
  - [ ] Add performance indicators

### 3.2 Error Handling & Fallbacks
- [ ] **Improve error messages**
  - [ ] Clear "not a tree" explanations
  - [ ] Suggest alternative algorithms
  - [ ] Add layout requirement documentation
- [ ] **Implement graceful fallbacks**
  - [ ] Fallback algorithms for unsupported graphs
  - [ ] Progressive layout degradation
  - [ ] Error recovery mechanisms

### 3.3 Documentation & Examples
- [ ] **Create layout examples**
  - [ ] Example graphs for each layout type
  - [ ] Before/after comparisons
  - [ ] Use case demonstrations
- [ ] **Write developer guide**
  - [ ] How to add new algorithms
  - [ ] Layout configuration guide
  - [ ] Troubleshooting common issues

## 📋 Success Metrics

### Phase 1 Success Criteria
- [ ] Circular layout works with traffic light (no errors)
- [ ] Radial layout properly understood/implemented
- [ ] All 6 layouts tested and documented
- [ ] Zero layout failures on test data

### Phase 2 Success Criteria  
- [ ] 3+ Graphviz algorithms available
- [ ] Configurable layout exposure working
- [ ] Easy algorithm switching in dev mode
- [ ] Clear algorithm documentation

### Phase 3 Success Criteria
- [ ] All layouts have optimal defaults
- [ ] Settings validation prevents bad configurations
- [ ] Helpful error messages for all failure modes
- [ ] Complete documentation and examples

## 🚀 Implementation Order

### Sprint 1 (Critical)
1. Fix circular layout with graphviz.circo
2. Complete testing of all layouts
3. Update documentation with real results

### Sprint 2 (Important)  
1. Add remaining Graphviz algorithms
2. Implement configurable layout exposure
3. Create algorithm experimentation tools

### Sprint 3 (Nice to Have)
1. Fine-tune all default settings
2. Improve error handling and fallbacks
3. Complete documentation and examples

## 📝 Notes & Decisions

### Key Decisions Needed
- [ ] Keep radial as "Radial Tree" or replace with twopi?
- [ ] Which Graphviz algorithms to prioritize?
- [ ] How to handle algorithm-specific settings in UI?

### Technical Considerations
- [ ] ELK schema updates may require careful migration
- [ ] Graphviz algorithms may have different performance characteristics
- [ ] Need to handle algorithm-specific error cases

### User Experience Considerations  
- [ ] Layout names should be intuitive (Radial vs Circular)
- [ ] Default settings should work for most use cases
- [ ] Error messages should guide users to solutions
