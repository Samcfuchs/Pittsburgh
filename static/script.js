const tooltip = d3.select("div.tooltip")

const w = 800;
const h = 400;
var svg_map = d3.select("div.map")
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

    d3.selectAll("div.tool").style("top", h-10+"px")
    
    const houses = await d3.csv("data/zillow_pittsburgh.csv");
    console.log(houses)
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
    d3.select("div.map").append("h3").attr("class","detailhead").text("Home Details")
    let houseDetails = d3.select("div.map").append("div").attr("id","house-detail")
    
    function selectHouse(event, d){
        d3.select("#house-detail").html('')
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
            houseSelected = true // track that a house is selected
            // if the user clicks on a house, highlight it and show details
            d3.select(this).attr("r", 10 / k)
                .attr("selected", true)
                .style("fill","limegreen")
                .style("opacity","1")
                .attr("class", "selected")
                .raise()
            // Make a panel with details
            
            // make a details panel
            houseDetails.append("p").text("Address: "+ d["Street Address"])
            houseDetails.append("p").text("Type: "+ d["Property Type"])
            houseDetails.append("p").text("Beds: "+ d.Bedrooms)
            houseDetails.append("p").text("Baths: "+ d.Bathroom)
            houseDetails.append("p").text("Square Feet: "+ d["Finished Size (Sq.Ft.)"])
            houseDetails.append("p").text("Lot Size: "+ d["Lot Size (Sq.Ft.)"]+" sq. ft.")
            houseDetails.append("p").text("Year Built: "+ d["Year Built"])
            
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
    
    let houseTip = d3.select("div.map").append("div").attr("id","house-tip")

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

    let filters = {}
    function makeSlider(container, label, attribute, sliderWidth, sliderHeight) {
        let format = d3.format(",")
        if (label == "Price") format = d3.format("$,")
        if (label === 'Year Built') format = d3.format("")

        var values = houses.map(d => Number(d[attribute]));
        let extent = d3.extent(values);

        let xSliderScale = d3.scaleLinear()
          .domain(extent)
          .range([10, sliderWidth - 10])
        let xAxis = d3.axisBottom(xSliderScale)
          .tickFormat(d3.format('.2s'))
        if (label === "Year Built" || label === "Size (sq. ft)") {
            xAxis.tickFormat(d3.format(''))
        }

        let wrapper = container.append('div').attr('class', 'control');
        wrapper.append('div').text(label).attr("class","filterlabel");
       
        let canvas = wrapper.append('svg').attr('width', sliderWidth)
                                          .attr('height', sliderHeight+70)
                                          .attr('attribute', attribute);
        let areaLayer = canvas.append('g');
        // canvas.append('g').attr('transfrorm',`translate(0, ${sliderHeight})`)
        //                   .call(xAxis);
        

        histoGen = d3.histogram().domain( extent ).thresholds(10)

        let counts = histoGen(values);

        counts.unshift({ x0: 0,
                        x1: counts[0].x0,
                        length: counts[0].length });

        let yScale = d3.scalePow().exponent(1/2).domain( d3.extent(counts, d => d.length) )
                                    .range([sliderHeight, 10]);

        let area = d3.area().x(d => xSliderScale(d.x1))
          .y0(yScale(0))
          .y1(d => yScale(d.length))
          .curve(d3.curveNatural);
        areaLayer.append('path').datum(counts)
          .attr('class', 'area')
          .attr('d', area)
          .style("fill","green");


        // basic filter func to later get replaced by user input
        let filterFunc = d => true;
        filters[attribute] = filterFunc;

        var brush = d3.brushX().extent([[10,0],                           // Upper left corner
                                        [sliderWidth-10, sliderHeight+10]])  // Lower right corner
                               .on('brush end', brushMoved);

        let labelsDiv=wrapper.append("div").attr("class","label-container")
        let minDiv = labelsDiv.append("span").attr("class","min")
        minDiv.append("h3").attr("class","min").text("Minimum")
        let startTxt = minDiv.append("p").attr("class","min")

        let maxDiv = labelsDiv.append("span").attr("class","max")
        maxDiv.append("h3").attr("class","max").text("Maximum")
        let endTxt = maxDiv.append("p").attr("class","max")

        startTxt.text(format(parseInt(extent[0])))
        endTxt.text(format(parseInt(extent[1])))

        

        function brushMoved(event) {
            
            if (event.selection !== null) {
                // Run scales in reverse to get data values for the ends of the brush
                let start = xSliderScale.invert( event.selection[0] );
                let end = xSliderScale.invert( event.selection[1] );

                startTxt.text(format(parseInt(start)))
                endTxt.text(format(parseInt(end)))

                // Overwrite old filter
                // TODO this can probably be optimized
                let filterFunc = d => (parseFloat(d[attribute]) >= start) && (parseFloat(d[attribute]) <= end)
                filters[attribute] = filterFunc;

                // TODO Update plots in accordance with filters
                updateMap(filters)
            }
            // If user clears filter go back to generic filter
            else {
                let filterFunc = d => true;
                filters[attribute] = filterFunc;
                let [start,end] = extent
                startTxt.text(format(parseInt(start)))
                endTxt.text(format(parseInt(end)))

            }
        }

        let brushedArea = canvas.append('g').attr('class','brush').call(brush);

        if(label=="Size (sq. ft)"){
            let axis = canvas.append("g").attr("class","axis"+label).attr("transform",`translate(0,${sliderHeight+3})`)
        .call(xAxis);
        }else{
            let axis = canvas.append("g").attr("class","axis"+label).attr("transform",`translate(0,${sliderHeight})`)
        .call(xAxis);
        }

    }

    function and(d, filters) {
        // I hate javascript what a stupid language
        let circles = []
        let val = true
        Object.values(filters).forEach(filter => {
            val = val && filter(d)
        })
        return val
    }

    function updateMap(filters) {
        // Just don't display points that can't pass the filters. Easier.
        // Maybe make this a class and then style the rejected points differently.
        let filteredCircles = circles.transition().style('opacity', d => and(d,filters) ? '0.5' : '0.05')
        .attr("filteredout", d => and(d,filters) ? 'false' : 'true')
        .style('pointer-events', d => and(d,filters) ? 'auto' : 'none').duration(100)
    }

    function getFiltered(){
        filtered =
        svg_map.selectAll("circle.point")
        .filter(function() {
            return d3.select(this).attr("filteredout") == "false"; // filter by single attribute
        })
        return(filtered)
    }

    // FILTERS

    makeRange(d3.select('div#bedbath'), 'Bedrooms', 'Bedrooms')
    makeRange(d3.select('div#bedbath'), 'Bathrooms', 'Bathroom')
    d3.select('div#filters').append("hr")
    makeCheckboxes(d3.select('#filters'), 'Class', 'Property Type')
    d3.select('div#filters').append("hr")


    makeSlider(d3.select('div#filters'), 'Price', 'Sale Amount', 400, 30)
    d3.select('div#filters').append("hr")

    makeSlider(d3.select('div#filters'), 'Year Built', 'Year Built', 400, 25)
    d3.select('div#filters').append("hr")

    makeSlider(d3.select('div#filters'), 'Size (sq. ft)', 'Finished Size (Sq.Ft.)', 400, 25)
    
    //makeSlider(d3.select('div#filters'), 'Size (sq. ft)', 'Finished Size (Sq.Ft.)', 400, 30)

    function makeRange(container, label, attribute) {
        values = houses.map(d => parseInt(d[attribute]))
        let extent = d3.extent(values)
        console.log(extent)

        let wrapper = container.append('div').attr('class', 'control')
        wrapper.append('div').text(label).attr('class', 'rangelabel')

        let min_input = wrapper.append('input')
            .attr('type','number')
            .attr('min', extent[0])
            .attr('max', extent[1])
            .attr('class', 'range min')
            .attr('placeholder', '0')
            .on('change', rangeUpdate)

        wrapper.append("span").append("p").text(" - ")

        let max_input = wrapper.append('input')
            .attr('type','number')
            .attr('min', extent[0])
            .attr('max', extent[1])
            .attr('class', 'range min')
            .attr('placeholder', extent[1])
            // This gives the input a starting value...but then you can't see
            // the helper text.
            //.attr('value', extent[1])
            .on('change', rangeUpdate)

        function rangeUpdate() {
            let range = [parseInt(min_input.node().value), parseInt(max_input.node().value)]

            range = range.map((n,i) => isNaN(n) ? extent[i] : n)

            filters[attribute] = function(d) {
                return d[attribute] >= range[0] && d[attribute] <= range[1]
            }

            updateMap(filters)
            //console.log(range)
        }
    }

    function makeCheckboxes(container, label, attribute) {
        values = houses.map(d => d[attribute])
        let unique = new Set(values)
        console.log(unique)

        let wrapper = container.append('div').attr('class', 'control')
        wrapper.append('div').text(label).attr('class', 'checkboxlabel')
        let boxesDiv = wrapper.append("div").attr("class","boxes")
        

        unique.forEach(v => {
            boxesDiv.append('input').attr('type','checkbox')
                .attr('name', v)
                .property('checked', 'true')
                .on('input', checkboxUpdate)
            boxesDiv.append('label').text(v).attr('class', 'valuelabel')
                .attr('for', v)
            boxesDiv.append('br')
        })

        function checkboxUpdate() {
            let desired_values = {}
            unique.forEach(v => {
                desired_values[v] = wrapper.select(`input[name="${v}"]`)
                                        .property('checked')
            })

            filters[attribute] = function(d) {
                return desired_values[d[attribute]]
            }

            updateMap(filters)
        }
    }
console.log(filters)

    updateMap(filters)

};
requestMap()
