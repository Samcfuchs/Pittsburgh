const tooltip = d3.select("div.tooltip")

const w = 800;
const h = 500;
var svg_map = d3.select("body")
.append("svg").attr("id","map")
.attr("width", w)
.attr("height", h)
var g = svg_map.append("g")
const width_map = w;
const height_map = h;
const margin_map = { top: 20, right: 20, bottom: 20, left: 20 };
const mapWidth = width_map - margin_map.left - margin_map.right;
const mapHeight = height_map - margin_map.top - margin_map.bottom;
var focused = false;

const requestMap = async function () {
    var k = 1;
    const data = await d3.json("data/pittsburgh.geojson");
    console.log(data);
    
    var projection = d3.geoMercator().fitSize([mapWidth, mapHeight], data);
    var path = d3.geoPath().projection(projection);
    
    let pittMap = g.selectAll("path.neighborhood").data(data.features)
    .join("path")
    .attr("clicked","false")
    .attr("class", "neighborhood")
    .attr("d", path)
    .style("fill", "#f5f5f5")
    .style("stroke", "#82680a")
    .style("stroke-width","0.5")
    var active = ''
    pittMap.on("mouseover", hoverPitt)
    pittMap.on("mouseout",function(event,d) {
        if(focused===false){
            active = d
            var selected = d3.select(this) 
            pittMap.on("mouseover", function(event,d){ // check if mouse is entering another neighborhood
                if(d!==active && focused==false){ // only update hover if the user is over a different area
                    selected.style("fill","#f5f5f5")
                    // reset active area, highlight new hovered area
                    active = d
                    d3.select(this).style("fill","#f0ae00") 
                    d3.selectAll("p.tooltip").text(d.properties.name);
                }
            })
        }
    })
    pittMap.on("mouseover", hoverPitt)
    pittMap.on("click", clicked)
    
    function hoverPitt(event, d){
        if(focused===false){
            active = d
            // only allow mouseovers when not selecting specific area
            d3.select(this).style("fill","#f0ae00")
            d3.selectAll("p.tooltip").text(d.properties.name);
        }
    }
    
    const houses = await d3.csv("data/zillow_pittsburgh.csv");
    let circles = g.selectAll("circle").data(houses)
    .join("circle")
    .attr("cx", d => projection(([d.Longitude, d.Latitude]))[0] + "px")
    .attr("cy", d => projection(([d.Longitude, d.Latitude]))[1] + "px")
    .attr("r", 4 / k)
    .attr("class", "point")
    .attr("selected",false)
    .style("opacity", "0.5")
    .style("fill", "#006633")
    .style("stroke", "black")
    .style("stroke-width", 0.5 / k);
    circles.on("mouseover", refreshHouseTip)
    circles.on("mouseout",  removeTip)
    circles.on("click", selectHouse)
    circles.on('mousemove', moveTip)
    
    var selectedHouse = ''
    tracker = ''
    // Create the div for the house details
    let houseDetails = d3.select("body").append("div").attr("id","house-detail")
    
    function selectHouse(event, d){
        d3.select("#house-detail").remove()
        if (tracker !== d) {
            console.log("trying to add new")
            // if the newly selected house is not the current one...
            if(selectedHouse !== ''){ // only deselect if something was there
                selectedHouse
                .style("fill","#006633") //reset color...
                .attr("r", 4 / k) // and size...
                .attr("selected",false) // and deselect
                .style("opacity", "0.5") 
                .attr("class", "point")
            }
            selectedHouse = d3.select(this)
            tracker = d
            console.log(this, d3.select(d))
            houseSelected = true // track that a house is selected
            // if the user clicks on a house, highlight it and show details
            d3.select(this).attr("r", 10 / k)
                .attr("selected", true)
                .style("fill","limegreen")
                .style("opacity","1")
                .attr("class", "selected")
            // Make a panel with details
            
            // make a details panel
                houseDetails.append("p").text("Beds: "+ d.Bedrooms)
                .append("p").text("Baths: "+ d.Bathroom)
                .append("p").text("Price: "+ d["Sale Amount"])
            
        } else { // if the same house is clicked
            console.log("trying to deselect")
            d3.select(this)
                .style("fill","#006633") //reset color...
                .attr("r", 4 / k) // and size...
                .attr("selected",false) // and deselect
                .style("opacity", "0.5") 
            houseSelected = false // deselect it
            selectedHouse = '' // nothing is selected
            tracker = ''
        }
        
    }

    function moveTip(e,d) {
        houseTip.style('left', e.pageX+10+'px').style('top', e.pageY+10+'px')
    }
    
    var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', function(event) {
        k = event.transform.k
        g.selectAll('path')
        .attr('transform', event.transform).style("stroke-width", 0.5 / k);
        g.selectAll('circle')
        .attr('transform', event.transform)
        .attr("r", 4 / k)
        .style("stroke-width", 0.5 / k)
        g.selectAll('circle.selected')
        .attr('transform', event.transform)
        .attr("r", 10 / k)
        g.selectAll('circle')
        .on("mouseover", refreshHouseTip)
        .on("mouseout", removeTip)
        .on("click",    selectHouse);
    });
    
    svg_map.call(zoom);
    
    let houseTip = d3.select("body").append("div").attr("id","house-tip")

    function refreshHouseTip(event, d){
        // create a tooltip for the house
        let house = d3.select(this)
        houseTip.style('display','block')
        
        let mouseCoords = [event.clientX, event.clientY];
        
        houseTip
        .style("left",mouseCoords[0]+"px")
        .style("top" ,mouseCoords[1]+20+"px")
        houseTip.select('p').remove()
        houseTip.append("p").text("Beds: "+ d.Bedrooms)
        .append("p").text("Baths: "+ d.Bathroom)
        .append("p").text("Price: "+ d["Sale Amount"])
        
        // we don't want the hover to alter size/color on a selected point
        if(house.attr("selected")==="false"){
            house.attr("r", 6 / k).style("opacity","1")
        }else{
            house.attr("r", 10 / k).style("opacity","1")
        }
        
    }
    
    function removeTip(event, d){
        // get rid of the house tooltip
        let house = d3.select(this)
        // don't alter size/color if the house is selected
        if(house.attr("selected")=="false"){
            house.attr("r", 4 / k).style("opacity","0.5")
        }
        //d3.selectAll("#house-tip").remove()
        houseTip.style('display','none')
    }
    
    function clicked(event, d) { // zoom in on neighborhood on click
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();
        if(d3.select(this).attr("clicked")==="false"){
            // if the clicked on area isn't active, zoom to it & highlight
            focused = true;
            d3.select(this).attr("clicked","true")
            pittMap.transition().style("fill", "#baa98f");
            d3.select(this).transition().style("fill", "#f0ae00");
            svg_map.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
            .translate(w / 2, h / 2)
            .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / w, (y1 - y0) / h)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg_map.node())
            );
        } else if(d3.select(this).attr("clicked")==="true"){
            // if the area is active, zoom back out and un-highlight
            focused = false;
            pittMap.transition().style("fill", "#f5f5f5");
            d3.select(this).attr("clicked","false")
            const [[x0, y0], [x1, y1]] = path.bounds(data);
            svg_map.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
            .translate(w / 2, h / 2)
            .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / w, (y1 - y0) / h)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg_map.node())
            );
        } 
        
    }
};
requestMap()
    
    