# ReactFlow Inspector V2 Rewrite

## Work for this branch:

### Round 1

- [ ] Fix active state edges and previous transition edge styling. 
  - [ ] for active states, all outgoing edges are active transitions that I call "active edges"
  - [ ] and our machine "change event" actually tracks { from, to, type } which tells us what we need to know about the previous transition to identify it even if we switch visualizers. 
  - [ ] right now the "previous transition" label has the "button" style that I want on active edges. 
    - [ ] fix label styling of active edges
    - [ ] leave previous edge **label** styling to be same as inactive edge labels 
  
### Round 2
  
  - [ ] Highlighting previous transition edge is NOT working on hierarchical layouts AT ALL did you strip the edge formatting with the animated dashed line?
  - [ ] i guess we can color the border of previous transition edge label same color as prev transition edge 
- [ ] Move layout button to top right corner (currently has margin positioning. make flush with corner)
- [ ] is there a way to have container nodes size around their children, ie if user rearranges. I think right now it is more like the container is fixed and children cannot leave it. 

# Inbox


 