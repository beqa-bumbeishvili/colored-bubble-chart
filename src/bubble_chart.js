function bubbleChart() {

  var width = 940;
  var height = 600;

  var tooltip = floatingTooltip('rect-tooltip', 240);

  var center = { x: width / 2, y: height / 2 };

  var forceStrength = 0.03;

  var bubbles = null;
  var nodes = [];

  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  simulation.stop();

  var fillColor = d3.scaleOrdinal()
    .domain(['low', 'medium', 'high'])
    .range(['#beccae', '#9caf84', '#7aa25c']);

  function createNodes(rawData) {
    prioritiesArray = ['low', 'medium', 'high'];

    var maxAmount = d3.max(rawData, function (d) { return +d["Dollars Investment"]; });

    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([2, 85])
      .domain([0, maxAmount]);

    var myNodes = rawData.map(function (d) {
      return {
        id: d.id,
        radius: radiusScale(+d["Dollars Investment"]) / 1.3,
        value: +d["Dollars Investment"],
        name: d.Name,
        group: prioritiesArray[Math.floor(Math.random() * prioritiesArray.length)],
        category: d.Tags,
        year: d.Date,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    myNodes.sort(function (a, b) { return b.value - a.value; });

    return myNodes;
  }

  var chart = function chart(selector, rawData) {
    var data = setDataFormats(rawData);

    nodes = createNodes(data);

    var svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.group); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    // var images = bubbles.selectAll('.image')
    //   .data(nodes)
    //   .enter()
    //   .append("svg:image")
    //   .classed("image")
    //   .attr("xlink:href", function (d) { return "https://crunchbase-production-res.cloudinary.com/image/upload/c_lpad,h_120,w_120,f_jpg/v1476902335/gxc55ywhnod0a9jh0wtd.jpg"; })
    //   .attr("x", function (d) { return -25; })
    //   .attr("y", function (d) { return -25; })
    //   .attr("height", 30)
    //   .attr("width", 30);


    bubbles = bubbles.merge(bubblesE);
    // bubbles = bubbles.merge(images);

    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

    simulation.nodes(nodes);

    groupBubbles();
  };

  function setDataFormats(data) {
    var fixedAmount = setAmount(data);
    var dataWithId = setID(data);
    return dataWithId;
  }

  function setAmount(data) {
    for (var i = 0; i < data.length; i++) {
      data[i]["Dollars Investment"] = parseInt(data[i]["Dollars Investment"].replace('$', ''));
    }
    return data;
  }

  function setID(data) {
    for (var i = 0; i < data.length; i++) {
      data[i]["id"] = i + 1;
    }
    return data;
  }

  function ticked() {
    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  function nodeYearPos(d) {
    return yearCenters[d.year].x;
  }

  function groupBubbles() {

    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

    simulation.alpha(1).restart();
  }

  function showYearTitles() {

    var yearsData = d3.keys(yearsTitleX);
    var years = svg.selectAll('.year')
      .data(yearsData);

    years.enter().append('text')
      .attr('class', 'year')
      .attr('x', function (d) { return yearsTitleX[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }

  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Title: </span><span class="value">' +
      d.name +
      '</span><br/>' +
      '<span class="name">Category: </span><span class="value">' +
      d.category +
      '</span><br/>' +
      '<span class="name">Amount: </span><span class="value">$' +
      addCommas(d.value) +
      '</span><br/>' +
      '<span class="name">Year: </span><span class="value">' +
      d.year +
      '</span>';

    tooltip.showTooltip(content, d3.event);
  }

  function hideDetail(d) {

    d3.select(this)
      .attr('stroke', d3.rgb(fillColor(d.group)).darker());

    tooltip.hideTooltip();
  }

  chart.toggleDisplay = function (displayName) {
    if (displayName === 'year') {
      splitBubbles();
    } else {
      groupBubbles();
    }
  };

  return chart;
}

var myBubbleChart = bubbleChart();

function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

d3.csv('data/data.csv', display);