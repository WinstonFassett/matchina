# ReactFlow Inspector V2 Rewrite

## Work for this branch:

### Round 1

- [x] Fix active state edges and previous transition edge styling. 
  - [x] for active states, all outgoing edges are active transitions that I call "active edges"
  - [x] and our machine "change event" actually tracks { from, to, type } which tells us what we need to know about the previous transition to identify it even if we switch visualizers. 
  - [x] right now the "previous transition" label has the "button" style that I want on active edges. 
    - [x] fix label styling of active edges
    - [x] leave previous edge **label** styling to be same as inactive edge labels 
### Round 2
  
- [x] Highlighting previous transition edge is NOT working on hierarchical layouts AT ALL did you strip the edge formatting with the animated dashed line?
- [x] i guess we can color the border of previous transition edge label same color as prev transition edge 
- [x] Move layout button to top right corner (currently has margin positioning. make flush with corner)
- [x] agent added a bunch of hierarchical settings UI when trying to match v1 defaults which was apples/oranges and also now those settings are available on all layouts and not having effect there.
- [x] let's make the layout button one size smaller, ie it is like a regular button, needs to be less obtrusive. 

### Round 3 - Making Non-Hierarchical Layouts do Hierarchical Layout

- [ ] styling fixes 
  - [ ] fix: in both themes, there are unwanted gray bordered boxes around nodes - these are visual artifacts
  - [ ] fix: in both themes, the grouping node has too many boxes and backgrounds. keep color, simplify 

NO YOU ARE NOT DONE YET!!!

We have some layout that don't really do hierarchy. YET.

Sugiyama, Tree, Force all layout nested descendants and their container to contain its children.

The others do not. Also their defaults are terrible. They have not gotten as much attention as the hierarchical ones. But they are options and need to be made to work correctly. 
- [ ] They should basically manage their own recursive layout and sizing of descendants when present. 
	- [ ] FAILED for these layouts:
		- [ ] organic 
			- [x] fix lays out child node internally but does not layout that as a node alongside its peers. 
			- [x] fix is jumbled.
        - [ ] children are laid out but Inactive node is VERY close to Active node, too close to read edge label, is basically adjacent.
		- [ ] circular 
			- [ ] does not lay out children, 
			- [ ] does not remotely have enough spacing between nodes, is a mess. is jumbled
		- [ ] grid
			- [ ] does not lay out children, 
			- [ ] does not remotely have enough spacing between nodes, is a mess. is jumb

Do you remember what I said about spacing? 
- [ ] We need to consider spacing between nodes that allows for roughly a 75-100% of an average node width between them to accommodate EDGE labels!





- [x] Also, the settings should, like our other defaults for better working layouts, be configured for use with ReactFlow nodes and our expected default sizes ie of nodes and of labels being about half height and half width of nodes. 
- [x] Grid layout options could be better. I thought there was a way to specify rows or cols and have a max or something. 
- [ ] We DO have research on Elk settings at a detail level that is supposed to inform these settings screens. Mainly so that we have ALL the settings that DO have an effect on a given layout and NONE of the settings that DO NOT have an effect on a given layout. Audit this and ensure we are using best settings for everything. But write audit doc and prompt to commit before trying this because it could get messy, I fear


# Inbox

- [ ] is there a way to have container nodes size around their children, ie if user rearranges. I think right now it is more like the container is fixed and children cannot leave it. 