///////////////////////////////////////////////////////////
//
//  2011, 2012, 2014
//  RRichard
//
//  GMapper Module
//  
//  Uses Google Maps V3 and creates overlays, calculates distances, areas and 
//  visually allows for markup of a map with labels.
//
///////////////////////////////////////////////////////////

// Global GMapper 
var GMapper = {};

// GMapper Setup IIFE
(function(GMapper, gmaps){

  // Public configs properties
  GMapper.config = {
    "lat" :  30.7138297,
    "lon" :  -95.5420213, 
    "convertionRatioValue" : 3.2808399, // feet:meters
    "units" : "imperial", 
    "markerImage" : "img/selectpin100b.png",
    "markerPinImage" : "img/mkrpinc.png"
  }
  
  // constants
  var CONVERSIONRATIO = GMapper.config.convertionRatioValue; // feet:meters
  var CONVERSIONRATIO2 = CONVERSIONRATIO*CONVERSIONRATIO;
  
  
  // Private properties
  var pgon = new gmaps.Polygon();
  var ruler = new gmaps.Polyline();
  var rulercircle = new gmaps.Circle();
  
  // points
  var rulerpoints = new gmaps.MVCArray();
  var points = new gmaps.MVCArray();
  var pointsback = new gmaps.MVCArray();
  
  // markers
  var mkrpins = new gmaps.MVCArray();
  var mkrlabels = new gmaps.MVCArray();
  var mkroptions = { raiseOnDrag: false };
  var mkrimg = new gmaps.MarkerImage(GMapper.config.markerImage, null, null, new gmaps.Point(51,51));
  //var mkrimg2 = new gmaps.MarkerImage("selectpin100b.png", null, null, new gmaps.Point(51,51));
  var mkrselect = new gmaps.Marker(mkroptions);
  var mkrpinimg = new gmaps.MarkerImage(GMapper.config.markerPinImage, null, null, new gmaps.Point(3,3));
  var mkrpoint = new gmaps.Marker();
    
  // tracking properties
  var lastdistance = null;
  var lastpoint = null;
  var bCleared = false;
  var bShowingRuler = false;
  var bShowingRulerCircle = false;
  var units = GMapper.config.units;
  
  var map = null; 
  
  // Public Functions
  GMapper.initialize = function (){
    
    console.log("Initializing GMapper");
    
    var latlng = new gmaps.LatLng(GMapper.config.lat, GMapper.config.lon);

    GMapper.myOptions = {
      zoom: 18,
      center: latlng,
      mapTypeId: gmaps.MapTypeId.SATELLITE,
      disableDefaultUI: true,
      minZoom: 16,
      zoomControl: true, 
      backgroundColor: "#000000"
    
    };
  
    // bind map to map_canvas
    map = new gmaps.Map(document.getElementById("map_canvas"), GMapper.myOptions);

    // bind event listeners to map
    //gmaps.event.addListener(map, "dblclick", center_selector);  

    // setup marker selector  
    mkrselect.setMap(map);
    mkrselect.setIcon(mkrimg);
    mkrselect.setDraggable(true);
    mkrselect.setAnimation(null);
    mkrselect.setPosition(latlng);
    mkrselect.raiseOnDrag = false;

    // Add Event Listeners to marker selector
    /*
    gmaps.event.addListener(mkrselect, 'dragstart', function() {

    });
    gmaps.event.addListener(mkrselect, 'dragend', function() {

    });
    */
   
    gmaps.event.addListener(mkrselect, "click", function(){
          //mkrselect.raiseOnDrag=false;
          place_marker_click();
    });
   
    gmaps.event.addListener(mkrselect, "drag", calcSelectorPointDistance); 
  
    // setup marker pin 
    mkrpoint.setMap(map);
    mkrpoint.setIcon(mkrpinimg);
    mkrpoint.setDraggable(false);
    mkrpoint.setAnimation(null);
    mkrpoint.setPosition(null);
      
    // bind polygon
    var plOptions = {
      
      strokeColor: "#FF0000",
      strokeWeight: 5,
      strokeOpacity: 0.3
         
    };
  
    pgon.setOptions(plOptions);
    pgon.setMap(map);
    pgon.setPath(points);
    gmaps.event.addListener(pgon, "click", pgon_click);
  
    // setup ruler polyline options
    var plOptions = {
      
      strokeColor: "#FFFB00",
      strokeWeight: 2,
      strokeOpacity: 0.5
         
    };
    ruler.setOptions(plOptions);
    ruler.setMap(map);
    //pgon.setPath(points);

    // setup ruler circle
    var plOptions = {
      strokeColor: "#FFFB00",
      strokeWeight: 1,
      strokeOpacity: 0.2, 
      fillColor: "#101010",
      fillOpacity: 0.1
    };
    rulercircle.setOptions(plOptions);
  }

  GMapper.label_distances = function(){
    if(points.getLength()>1){
      
      for(i=0;i<points.getLength()-1;i++){
      
        var p1 = points.getAt(i);
        var p2 = points.getAt(i+1); 
        var position = gmaps.geometry.spherical.interpolate(p1, p2, 0.5);
        var distance = gmaps.geometry.spherical.computeDistanceBetween(p1, p2);
        
        distance = distance * CONVERSIONRATIO; 
        
        var title = " "+distance.toFixed(2)+" ft ";
         // setup marker pin 
        /*
        var mkr = new gmaps.Marker();
        //mkr.setIcon(mkrpinimg);
        mkr.setDraggable(false);
        mkr.raiseOnDrag = false;
        mkr.setAnimation(null);
        mkr.setPosition(position);
        mkr.setTitle(title);      
        mkr.setMap(map);
        //gmaps.event.addListener(mkr, "drag", pin_drag);
        */
        
        var label = new Label({
          map: map
        });
        label.set('position', position);
        label.set('text', title);
        
        mkrlabels.push(label);
              
      }
    }
    
    // handle wrap close poly
    if(points.getLength()>2){
      var p1 = points.getAt(0);
      var p2 = points.getAt(points.getLength()-1); 
      var position = gmaps.geometry.spherical.interpolate(p1, p2, 0.5);
      var distance = gmaps.geometry.spherical.computeDistanceBetween(p1, p2);
        
      distance = distance * CONVERSIONRATIO; 
      
      var title = " "+distance.toFixed(2)+" ft ";
      
     // setup marker pin 
      /*
      var mkr = new gmaps.Marker();
      //mkr.setIcon(mkrpinimg);
      mkr.setDraggable(false);
      mkr.raiseOnDrag = false;
      mkr.setAnimation(null);
      mkr.setPosition(position);
      mkr.setTitle(title);      
      mkr.setMap(map);
      //gmaps.event.addListener(mkr, "drag", pin_drag);
      */
      
      var label = new Label({
        map: map
      });
      label.set('position', position);
      label.set('text', title);
      
      mkrlabels.push(label);
    }
  }

  GMapper.center_selector = function(position){
      mkrselect.setPosition(map.getCenter());
  }

  GMapper.undo = function(){
    if(bCleared){
      points = pointsback;
      bCleared = false;
    } else
    {
      lastpoint = points.pop();
      var mkr = mkrpins.pop();
      if(mkr)mkr.setMap(null);
    }
    pgon.setPath(points);
    calcArea();
    if(bShowingRuler)draw_ruler();
    if(bShowingRulerCircle)draw_ruler_circle();
  }
  
  GMapper.redo = function(){
    points.push(lastpoint);
    place_pin(lastpoint);
    pgon.setPath(points);
    calcArea();
    if(bShowingRuler)draw_ruler();
    if(bShowingRulerCircle)draw_ruler_circle();
  }

  GMapper.clearpoints  = function(){
    bCleared = true;
    pointsback = points;
    points.clear();
    pgon.setPath(points);
    mkrpins.forEach(function(mkr, i){
         mkr.setMap(null);
    });
    
    mkrpins.clear();
    
    
    mkrlabels.forEach(function(mkr, i){
         mkr.setMap(null);
    });
    
    mkrlabels.clear();
    
    e = document.getElementById("distancetext");
    if(e){
      e.innerHTML = "";
    
    }   
    e = document.getElementById("areatext");
    if(e){
      e.innerHTML = "";
    
    } 
    
    e = document.getElementById("circlediametertext");
    if(e)e.innerHTML = "";
    e = document.getElementById("circleareatext");
    if(e)e.innerHTML = "";
    
    // clear rulers
    if(bShowingRuler)ruler.setMap(null);
    rulercircle.setMap(null);
  }
  
  GMapper.toggle_ruler = function(){
    if(bShowingRuler){
      // hide
      ruler.setMap(null);
      bShowingRuler=false;
    }else
    { // show
      draw_ruler();
      bShowingRuler=true;
    }
  
  }
  
  GMapper.toggle_rulercircle = function(){
    if(bShowingRulerCircle){
      // hide
      bShowingRulerCircle=false;
    }else
    { // show
      draw_ruler_circle();
      bShowingRulerCircle=true;
    }
  }
  
  function place_marker_click(position){
    //mkrselect.setPosition(position.latLng);
    //alert(mkrselect.getPosition().toString());
    points.push(mkrselect.getPosition());
    pgon.setPath(points);
    place_pin(mkrselect.getPosition());
    
    if( points.getLength()>2){
      calcArea();  
    }
  }

  function point_click(position){
    //alert(position.latLng.toString());
    points.push(position.latLng);
    //draw_polyline();
    place_pin(position.latLng);
    pgon.setPath(points);
  }

  function pgon_click(position){
    var msg = new gmaps.InfoWindow();
    var area = gmaps.geometry.spherical.computeArea(points, null);
    var output = "Area: "+area;
    
    // setup and display
    msg.setContent(output);
    msg.setPosition(position.latLng);
    msg.open(map);
  }

  function draw_polyline(){
    if(points.getLength()>1){
      var st = "";
      points.forEach(function(e, i){
             
      });
      
    }
  }

  function pin_drag(position){
  }

  function place_pin(position){
    // setup marker pin 
    var mkr = new gmaps.Marker();
    mkr.setIcon(mkrpinimg);
    mkr.setDraggable(false);
    mkrselect.raiseOnDrag = false;
    mkr.setAnimation(null);
    mkr.setPosition(position);      
    mkr.setMap(map);
    //gmaps.event.addListener(mkr, "drag", pin_drag);
    
    mkrpins.push(mkr);
  
  }
  
  function place_pins(){
    if(points.getLength()>1){
      mkrpins.clear();
      points.forEach(function(e, i){
        var mkr = new mkrpoint;
        mkr.setPosition(e.latLng);      
        mkr.setMap(map);
      });
    }
  }
  
  function calcSelectorPointDistance(position){
  
    var p1, p2;
    var distance, area, circumf, diameter;
    var e, text;
    if( points.getLength()>0){
      
    p1 = points.getAt(points.getLength()-1)
    p2 = position.latLng;
    
    distance = gmaps.geometry.spherical.computeDistanceBetween(p1, p2);
    lastdistance = distance;
    distance = distance * CONVERSIONRATIO;
    e = document.getElementById("distancetext");
    
    if(e)
      e.innerHTML = "Distance: " + distance.toFixed(2);
    
    if(bShowingRulerCircle){
      draw_ruler_circle();
      diameter = distance*2;
      area=(distance*distance)*3.14159; 
      e = document.getElementById("circlediametertext");
      
      if(e)
        e.innerHTML = "Circle Diameter: " + diameter.toFixed(2);
      
      e = document.getElementById("circleareatext");
      
      if(e)
        e.innerHTML = "Circle Area: " + area.toFixed(2);
      
    }

    if(bShowingRuler)
      draw_ruler();
    }
  }

  function calcArea(){
    var e, area;
    
    if( points.getLength()>2){
      area = gmaps.geometry.spherical.computeArea(points, null);
      area = area * CONVERSIONRATIO2;
      e = document.getElementById("areatext");
      if(e){
        e.innerHTML = "Area: " + area.toFixed(2);
      
      }   
    }else
    {
      e = document.getElementById("areatext");
      if(e){
        e.innerHTML = "Area: ";
      
      }  
    }
  }
  
  function draw_ruler(){
      
    var tp = points.getLength();
    var p1, p2;
    
    if(tp>0){
      p1 = points.getAt(tp-1);
      p2 = mkrselect.getPosition();
      rulerpoints.clear();
      rulerpoints.push(p1);
      rulerpoints.push(p2);
      ruler.setPath(rulerpoints);
      ruler.setMap(map);
    }
  }

  function draw_ruler_circle(){
    var tp = points.getLength();
    var p1, p2;
      
    if(tp>0){
        p1 = points.getAt(tp-1);
        rulercircle.setCenter(p1);
        rulercircle.setRadius(lastdistance);
        rulercircle.setMap(map);
    }
  }  

  function Label(opt_options) {
   // Label object initialization
   this.setValues(opt_options);

   // Label specific css
   var span = this.span_ = document.createElement('span');
   span.style.cssText = "position: relative; left: -50%; top: -8px; " +
                        "white-space: nowrap; border: 1px solid '#888888'; " +
                        "padding: 2px; background-color: black; " +
                        "color: white; font-family: arial; font-size: 10px;";

   var div = this.div_ = document.createElement('div');
   div.appendChild(span);
   div.style.cssText = 'position: absolute; display: none';
  };
  Label.prototype = new gmaps.OverlayView;

  // Implement label onAdd
  Label.prototype.onAdd = function() {
   var pane = this.getPanes().overlayLayer;
   pane.appendChild(this.div_);

   // Ensures the label is redrawn if the text or position is changed.
   var me = this;
   this.listeners_ = [
     gmaps.event.addListener(this, 'position_changed',
         function() { me.draw(); }),
     gmaps.event.addListener(this, 'text_changed',
         function() { me.draw(); })
   ];
  };

  // Implement label onRemove
  Label.prototype.onRemove = function() {
   this.div_.parentNode.removeChild(this.div_);

   // Label is removed from the map, stop updating its position/text.
   for (var i = 0, I = this.listeners_.length; i < I; ++i) {
     gmaps.event.removeListener(this.listeners_[i]);
   }
  };

  // Implement label draw
  Label.prototype.draw = function() {
   var projection = this.getProjection();
   var position = projection.fromLatLngToDivPixel(this.get('position'));

   var div = this.div_;
   div.style.left = position.x + 'px';
   div.style.top = position.y + 'px';
   div.style.display = 'block';

   this.span_.innerHTML = this.get('text').toString();
  }; 
  
  // Initialize GMapper  
  GMapper.initialize();
    
}(window.GMapper = window.GMapper || {}, google.maps || {})); // End GMapper namespace  
 
    

