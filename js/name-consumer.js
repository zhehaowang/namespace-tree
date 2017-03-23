// UI functions
function connectFace() {
  // document.getElementById('expandAll').onclick = function () { treeView.expandAll(); };
  // document.getElementById('collapseAll').onclick = function () { treeView.collapseAll(); };
  freshOnly = document.getElementById('fresh-data').checked;
  maxTreeDepth = document.getElementById('max-depth').value;
  removeStaleFlag = document.getElementById('remove-stale-data').checked;
  defaultWaitTime = document.getElementById('default-wait-time').value;
  cutOffLength = document.getElementById('cut-off-length').value;
  maxBranchingFactor = document.getElementById('max-branching-factor').value;
  showTrustRelationship = document.getElementById('show-trust-relationship').checked;

  if (maxTreeDepth == "") {
    maxTreeDepth = -1;
  } else {
    maxTreeDepth = parseInt(maxTreeDepth);
  }

  if (defaultWaitTime == "") {
    defaultWaitTime = 100;
  } else {
    defaultWaitTime = parseInt(defaultWaitTime);
  }

  if (cutOffLength == "") {
    cutOffLength = -1;
  } else {
    cutOffLength = parseInt(cutOffLength);
  }

  if (maxBranchingFactor == "") {
    maxBranchingFactor = -1;
  } else {
    maxBranchingFactor = parseInt(maxBranchingFactor);
  }

  document.getElementById('pause').onclick = function () { 
    if (paused) {
      document.getElementById('pause').innerText = "Pause";
      paused = false;
      for (var i; i < pauseQueuedInterests.length; i++) {
        pauseQueuedInterests[i].setMustBeFresh(freshOnly);
        face.expressInterest(queuedInterests[i], onData, onTimeout);
      }
      pauseQueuedInterests = [];
    } else {
      document.getElementById('pause').innerText = "Resume";
      paused = true;
    }
  };

  var host = document.getElementById("host").value;
  face = new Face({"host": host});
  prefix = document.getElementById("prefix").value;
  
  expressInterestWithExclusion(new Name(prefix));
  expressInterestFromQueue();
}

// Internal mechanisms
function expressInterestWithExclusion(prefix, exclusion, leftmost, filterCertOrCommandOrPicInterest) {
  // don't filter interests specific to Flow by default
  if (filterCertOrCommandOrPicInterest === true) {
    var prefixName = (new Name(prefix)).toUri();
    if (prefixName.indexOf("ID-CERT") > 0) {
      console.log("stop probing this branch because it contains a certificate name, or is a signed interest");
      return;
    }
    if (prefixName.toLowerCase().indexOf(".jpg") > 0 || (new Name(prefix)).toUri().toLowerCase().indexOf(".png") > 0) {
      console.log("stop probing this branch because it is probably sending an image");
      return;
    }
    if (prefixName.toLowerCase().indexOf("updatecapabilities") > 0) {
      console.log("stop probing this branch because it is updating capabilities");
      return;
    }
    if (prefixName.toLowerCase().indexOf("requests") > 0) {
      console.log("stop probing this branch because it is sending request");
      return;
    }
  }

  var interest = new Interest(new Name(prefix));
  interest.setInterestLifetimeMilliseconds(4000);
  interest.setMustBeFresh(true);
  if (exclusion === undefined) {

  } else {
    interest.setExclude(exclusion);
  }
  if (leftmost === undefined || leftmost === true) {
    interest.setChildSelector(0);
  } else {
    interest.setChildSelector(1);
  }
  console.log("about to express interest: " + interest.getName().toUri());
  if (exclusion !== undefined) {
    console.log("with exclude: " + interest.getExclude().toUri());
  }
  if (!paused) {
    interest.setMustBeFresh(freshOnly);
    // for regular interests, to avoid instant explosion, we also use a queue instead of just express interest
    interestQueue.push(interest);
  } else {
    pauseQueuedInterests.push(interest);
  }
}

function expressInterestFromQueue() {
  if (interestQueue.length > 0) {
    var interest = interestQueue.shift();
    face.expressInterest(interest, onData, onTimeout);
  }
  setTimeout(function() {
    expressInterestFromQueue();
  }, defaultWaitTime);
}

function getRandomInt(min, max) {
  var min = Math.ceil(min);
  var max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomChar()
{
  var text = "";
  var candidates = "ABCD";

  for( var i = 0; i < 1; i++ )
      text += candidates.charAt(getRandomInt(0, candidates.length - 1));

  return text;
}

function fullScreen(){
  if (document.getElementById("connect-section").style.display != "none") {
    document.getElementById("connect-section").style.display = "none";
    document.getElementById("options-section").style.display = "none";
    document.getElementById("header").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("bottom-left").style.display = "none";
    document.getElementById("bottom-right").style.display = "none";
    document.getElementById("bottom").style.display = "none";
    document.getElementById("full-screen").textContent = "Back";
  }
  else {
    document.getElementById("connect-section").style.display = "block";
    document.getElementById("options-section").style.display = "block";
    document.getElementById("header").style.display = "block";
    document.getElementById("menu").style.display = "block";
    document.getElementById("bottom-left").style.display = "block";
    document.getElementById("bottom-right").style.display = "block";
    document.getElementById("bottom").style.display = "block";
    document.getElementById("full-screen").textContent = "View Full Screen";
  }
}

function buildDummyTree() {
  // Regular dummy data
  setInterval(function () {
    var components = getRandomInt(2, 6);
    var dataName = new Name();
    for (var i = 0; i < components; i ++) {
      dataName.append(getRandomChar());
    }
    var data = new Data(dataName);
    if (!paused) {    
      console.log("Dummy: adding data name " + dataName.toUri());
      insertToTree(data);
      setTimeout(function () {
        console.log("Dummy: removing data name " + dataName.toUri());
        removeFromTree(data);
      }, 7000);
    }
  }, 2000);

  document.getElementById('pause').onclick = function () { 
    if (paused) {
      document.getElementById('pause').innerText = "Pause";
      paused = false;
    } else {
      document.getElementById('pause').innerText = "Resume";
      paused = true;
    }
  };
}

// onclick fires after the check/uncheck takes place
function removeStaleData(element) {
  removeStaleFlag = element.checked;
}

function toggleTrustRelationship(element) {
  showTrustRelationship = element.checked;
}

function hashCode(str){
  var hash = 0;
  if (str.length == 0) return hash;
  for (var i = 0; i < str.length; i++) {
    var character = str.charCodeAt(i);
    hash = ((hash<<5)-hash)+character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function onData(interest, data) {
  var dataName = data.getName();
  console.log("got data: " + dataName.toUri());

  if (dataName.size() == 0) {
    return;
  }
  
  // we block multiple data with the same name from being displayed in the tree here
  if (receivedContent[dataName.toUri()] === undefined) {
    var addedContentNode = insertToTree(data);
    receivedContent[dataName.toUri()] = addedContentNode;
    // special hack for cert data so that we can later match without versioning
    // TODO: this hack means we don't support multiple versions of cert well...
    if (dataName.size() > 1 && dataName.get(-2).toEscapedString() === "ID-CERT") {
      receivedContent[dataName.getPrefix(-1).toUri()] = addedContentNode;
    }
    try {
      // no matter if showTrustRelationship is toggled, we leave a trace for trust relationship links 
      var signature = data.getSignature();
      if (signature !== null && signature !== undefined) {
        if (KeyLocator.canGetFromSignature(signature)) {
          var signerName = signature.getKeyLocator().getKeyName();
          var signerNameUri = signerName.toUri();
          // we don't deal with self-signed for now
          if (signerNameUri !== dataName.getPrefix(-1).toUri()) {
            if (receivedContent[signerNameUri] === undefined) {
              // we don't have the cert yet, we leave a placeholder
              if (signerNameUri in pendingTrustLinks) {
                pendingTrustLinks[signerNameUri].push(addedContentNode);
              } else {
                pendingTrustLinks[signerNameUri] = [addedContentNode];
              }
              // var dummySignerData = new Data(signerName);
              // signerContentNode = insertToTree(dummySignerData);
              // receivedContent[signerNameUri] = signerContentNode;
            } else {
              // we already have the cert (TODO: which we shouldn't because of cert versioning), push the links
              // TODO: this means for certs already fetched, we won't establish trust relationship correctly (unless with hack above)
              var signerContentNode = receivedContent[signerNameUri];
              multiParents.push({parent: signerContentNode, child: addedContentNode});
              console.log("** append signing relationship: " + signerNameUri + " --> " + dataName.toUri() + "**");
            }
          } else {
            console.log("** self-signed: " + dataName.toUri());
          }
        }
      }
    } catch (e) {
      console.log(e);
    }

    // if the new data we just inserted have a trace in the expected signers
    // (we don't have the veresion number after ID-CERT)
    var dataNameUriWithoutLastUri = dataName.getPrefix(-1).toUri();
    if (dataNameUriWithoutLastUri in pendingTrustLinks) {
      for (var idx in pendingTrustLinks[dataNameUriWithoutLastUri]) {
        multiParents.push({parent: addedContentNode, child: pendingTrustLinks[dataNameUriWithoutLastUri][idx]});
        console.log("** supplement signing relationship: " + dataNameUriWithoutLastUri + " --> <stored data> **");
      }
      delete pendingTrustLinks[dataNameUriWithoutLastUri];
    }
  }
  
  if (removeStaleFlag === true) {
    setTimeout(function() {
      removeFromTree(data);
    }, data.getMetaInfo().getFreshnessPeriod());
  }

  var interestName = interest.getName();
  // data is longer than interest, we probably should ask with exclusion
  if (dataName.size() > interestName.size()) {
    // if data name is longer than interest name by only one component
    if (dataName.size() - interestName.size() == 1) {
      // we only express interest interest with exclusion if the longer-than-interest-name-size-by-one data name has
      // sequence number, or
      // version number, or
      // segment number, or
      // pure number, or
      // sync digest
      // as the last element
      var lastComponent = dataName.get(-1);
      try {
        // version 
        var version = lastComponent.toVersion();
        console.log("finished probing this branch (data ending with version): " + interestName.toUri());
        return;
      } catch (exception) {

      }
      try {
        // segment
        var segment = lastComponent.toSegment();
        console.log("finished probing this branch (data ending with segment): " + interestName.toUri());
        return;
      } catch (exception) {

      } 
      try {
        // pure number
        var numbers = lastComponent.toEscapedString();
        var containsNonNumbers = false;
        for (var i = 0; i < numbers.length; i ++) {
          if (numbers.charCodeAt(i) >= 48 && numbers.charCodeAt(i) <= 58) {
            continue;
          } else {
            containsNonNumbers = true;
          }
        }
        if (!containsNonNumbers) {
          console.log("finished probing this branch (data ending with only numbers): " + interestName.toUri());
          return;
        }
      } catch (exception) {

      } 
    }

    var component = dataName.get(interestName.size());
    
    // ask for the next piece of data excluding the last component
    var exclusion = interest.getExclude();
    if (exclusion === undefined || exclusion === null) {
      exclusion = new Exclude();
    }
    // instead of range exclusion, we use component exclusion to avoid missing some data
    exclusion.appendComponent(component);
    expressInterestWithExclusion(interestName, exclusion, true);
    
    // ask for the first piece of data in a subnamespace, 
    // this data will be able to satisfy the interest, in that case, the next exclusion interest should fetch later data in that branch
    var newPrefix = new Name(dataName.getPrefix(interestName.size() + 1));
    console.log("new prefix: " + newPrefix.toUri());
    expressInterestWithExclusion(newPrefix, undefined, true);
  } else {
    // data is no longer interest, we are done probing this branch
    console.log("finished probing this branch (data length = interest length): " + interestName.toUri());
    return;
  }
}

function onTimeout(interest) {
  console.log("interest times out: " + interest.getName().toUri());
  // we keep sending out interests again in case new subsystems publishes data
  var newInterest = new Interest(interest);
  newInterest.refreshNonce();
  if (!paused) {
    newInterest.setMustBeFresh(freshOnly);
    interestQueue.push(newInterest);
  } else {
    pauseQueuedInterests.push(newInterest);
  }
}

function sausageUnitTest() {
  // Sausage test
  var data1 = new Data(new Name("/b/c"));
  insertToTree(data1);
  var data2 = new Data(new Name("/c/b/b"));
  insertToTree(data2);
  var data3 = new Data(new Name("/c/b/d"));
  insertToTree(data3);
  
  var couplingParent1 = tree.nodes(root).filter(function(d) {
    return d['name'] === '/';
  })[0];

  var couplingChild1 = tree.nodes(root).filter(function(d) {
    return d['name'] === 'd';
  })[0];

  multiParents = [{
    parent: couplingParent1,
    child: couplingChild1
  }];

  var data2 = new Data(new Name("/c/b/e"));
  insertToTree(data2);

  // Existing branch end test
  // var data1 = new Data(new Name("/a/b/a"));
  // insertToTree(data1);
  // var data1 = new Data(new Name("/a/a"));
  // insertToTree(data1);
  // setTimeout(function () {
  //   var data2 = new Data(new Name("/a"));
  //   insertToTree(data2);
  // }, 1000);

  // // Different branches
  // var data1 = new Data(new Name("/c/b"));
  // insertToTree(data1);
  // var data1 = new Data(new Name("/a/a"));
  // insertToTree(data1);
}
