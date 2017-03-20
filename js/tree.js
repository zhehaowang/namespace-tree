/************************************************
 * D3 sync tree render function
 ************************************************/
var treeData = [
  {
    "name": "/",
    "components": [],
    "parent": "null",
    "children": []
  }
];

var colorSet = ["#d1ebbb", "#7bafd0", "#deb276", "#92c3ad", "#f49158"];

// ************** Generate the tree diagram  *****************
var width_total = 4000;
var height_total = 600;
//document.body.clientHeight - document.getElementById("connect-section").offsetHeight- document.getElementById("option-section").offsetHeight;

var margin = {top: 20, right: 120, bottom: 20, left: 120},
  width = width_total - margin.right - margin.left,
  height = height_total - margin.top - margin.bottom;

var i = 0,
  duration = 750,
  root;

var cutOffLength = 10;

var tree = d3.layout.tree()
  .size([height, width]);

var diagonal = d3.svg.diagonal()
  .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("#tree").append("svg")
  .attr("viewbox", "0, 0, " + width_total + ", " + height_total)
  .attr("width", width + margin.right + margin.left)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

root = treeData[0];
// root.x0 = height / 2;
// root.y0 = 0;
var treeNodeMerged = clone(root);

update(root);

d3.select(self.frameElement).style("height", "500px");

function update(source) {
  // Summary about how this D3 .update(), .enter(), .exit(), .transition() abstraction works

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 120; });

  // Update the nodes
  var node = svg.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) { 
      return "translate(" + source.y + "," + source.x + ")"; 
    })
    .on("click", click);

  nodeEnter.append("circle")
    .attr("r", 1e-6)
    .style("fill", function(d) {
      if (d._children) {
        return "#fff"
      }
      return colorSet[d.depth % 5];
    })
    .style("stroke", function(d) {
      if (d._children) {
        return "#000"
      }
      return colorSet[d.depth % 5];
    })
    .style("stroke-width", function(d) {
      if (d._children) {
        return "2px";
      }
      return "1.5px";
    });

  nodeEnter.append("text")
    .attr("x", function(d) { return d.children || d._children ? 0 : 0; })
    .attr("dy", "-1em")
    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    .text(function(d) {
      if (d.name.length <= cutOffLength || d.is_content === true) {
        return d.name;
      } else {
        return d.name.substring(0, cutOffLength);
      }
    })
    .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function(d) { 
      return "translate(" + d.y + "," + d.x + ")"; 
    });

  nodeUpdate.select("circle")
    .attr("r", 10)
    .style("fill", function(d) {
      if (d._children) {
        return "#fff"
      }
      return colorSet[d.depth%5];
    });
  
  nodeUpdate.select("text")
    .style("fill-opacity", 1)
    .text(function(d) {
      if (d.name.length <= cutOffLength || d.is_content === true) {
        return d.name;
      } else {
        return d.name.substring(0, cutOffLength);
      }
    });

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) {
      return "translate(" + source.y + "," + source.x + ")";
    })
    .remove();

  nodeExit.select("circle")
    .attr("r", 1e-6);

  nodeExit.select("text")
    .style("fill-opacity", 1e-6);

  // Update the links
  var link = svg.selectAll("path.link")
    .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", function(d) {
      var o = {x: source.x, y: source.y};
      return diagonal({source: o, target: o});
    });

  // Transition links to their new position.
  link.transition()
    .duration(duration)
    .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
    .duration(duration)
    .attr("d", function(d) {
    var o = {x: source.x, y: source.y};
      return diagonal({source: o, target: o});
    })
    .remove();

  // Stash the old positions for transition.
  // nodes.forEach(function(d) {
  //   d.x0 = d.x;
  //   d.y0 = d.y;
  // });
}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

/* original function */

function findAmongChildren(node, str) {
  for (var child in node["children"]) {
    if (node["children"][child]["components"][0] == str) {
      return node["children"][child];
    }
  }
  return null;
}

function insertToTree(data) {
  var dataName = data.getName();

  var idx = 0;
  var nameSize = dataName.size();

  var treeNode = root;
  var changed = null;

  if (treeNode["children"] === undefined) {
    treeNode["children"] = [];
  }
  
  while (idx < nameSize && treeNode["children"].length > 0) {
    childMatch = false;
    for (var child in treeNode["children"]) {
      var tempNode = treeNode["children"][child];

      if (tempNode["components"][0] == dataName.get(idx).toEscapedString()) {
        childMatch = true;
        // this child matches the initial component
        idx += 1;
        for (var i = 1; i < tempNode["components"].length; i++) {
          var matchComponent = ""
          if (idx < nameSize) {
            matchComponent = dataName.get(idx).toEscapedString();
          }
          if (tempNode["components"][i] != matchComponent) {
            // we cannot fully match with this node, need to break this node into two
            remainingComponents = tempNode["components"].slice(i, tempNode["components"].length);
            var remainingChild = {
              "name": remainingComponents.join("/"),
              "components": remainingComponents,
              "children": tempNode["children"]
            };

            tempNode["components"] = tempNode["components"].slice(0, i);
            tempNode["name"] = tempNode["components"].join("/");
            
            var newChildComponents = [];
            while (idx < nameSize) {
              newChildComponents.push(dataName.get(idx).toEscapedString());
              idx ++;
            }
            
            if (newChildComponents.length > 0) {
              var newChild = {
                "name": newChildComponents.join("/"),
                "components": newChildComponents,
                "children": []
              };
              tempNode["children"] = [newChild, remainingChild];
              tempNode = newChild;
            } else {
              tempNode["children"] = [remainingChild];
            }
            
            changed = tempNode;
            break;
          } else {
            idx ++;
          }
        }
        // we can fully match with this node, need to try its children
        treeNode = tempNode;
        break;
      }
    }
    if (!childMatch) {
      break;
    }
  }

  if (idx < nameSize) {
    // no children of tree node can match, we need to insert new nodes
    var newChildComponents = [];
    while (idx < nameSize) {
      newChildComponents.push(dataName.get(idx).toEscapedString());
      idx += 1;
    }

    var newChild = {
      "name": newChildComponents.join("/"),
      "components": newChildComponents,
      "children": []
    };

    treeNode["children"].push(newChild);
    isDone = true;
    changed = treeNode;
    treeNode = newChild;
  }

  // insert data content object after this insertion's end node
  var content = "";
  try {
    content = data.getContent().buf().toString('binary');
  } catch (e) {
    content = "NULL";
  }

  var contentNode = {
    "name": content,
    "components": [content],
    "is_content": true
  };
  // append to last treeNode
  treeNode["children"].push(contentNode);
  changed = treeNode;

  update(root);
}

function debugTree(node) {
  if (node === undefined) {
    return;
  }
  console.log(node["components"].join("/"));
  for (var idx in node["children"]) {
    debugTree(node["children"][idx]);
  }
}

function clone(obj) {
  if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
    return obj;

  if (obj instanceof Date)
    var temp = new obj.constructor(); //or new Date(obj);
  else
    var temp = obj.constructor();

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj['isActiveClone'] = null;
      temp[key] = clone(obj[key]);
      delete obj['isActiveClone'];
    }
  }

  return temp;
}