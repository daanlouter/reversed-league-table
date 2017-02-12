var teams = [];
var matchesByTeam = [];
var hash = document.location.hash.replace('#','');
var speelrondes = [];
var speed = 1000;
var baseUrl = "https://rocky-reef-96663.herokuapp.com/data/";
var data;
// var year = document.location.search.replace('?','').split('&').filter(function(v){
// 	return v.indexOf('year=') > -1
// })[0].split('=')[1];
// var league = document.location.search.replace('?','').split('&').filter(function(v){
// 	return v.indexOf('league=') > -1
// })[0].split('=')[1];
// console.log(year, league)

loadData();

function loadData(){
	d3.csv('/new_data/N1.csv',function(resp){
		console.log(resp);
	_.uniq(resp,function(match){
		return match.HomeTeam
	}).forEach(function(team){
		teams.push(team.HomeTeam)
	})


	teams.forEach(function(team){
		var total = 34*3;

		var matches = resp.filter(function(match){
			if(match.HomeTeam === team || match.AwayTeam === team){
				return match
			}
		})

		matches.forEach(function(match,i){
			var isHome = match.HomeTeam === team ? true : false;
			var opponent = isHome ? match.AwayTeam : match.HomeTeam
			var result;
			var lostPoints;

			if(match.FTR === "H"){
				lostPoints = isHome ? 0 : 3;
				result = isHome ? "win" : "lose"
			}else if(match.FTR === "D"){
				lostPoints = 2;
				result = "draw"
			}else if(match.FTR === "A"){
				lostPoints = isHome ? 3 : 0;
				result = isHome ? "lose" : "win"
			}

			total -= lostPoints;

			if(!speelrondes[i]){
				speelrondes[i] = [];
			}

			speelrondes[i].push({
				team: team,
				points: total,
				latestResult: result + " against " + opponent
			})
		})

		matchesByTeam.push({
			team: team,
			matches: matches,
			points:[]
		})
	})

	matchesByTeam.forEach(function(team){
		var total = 34*3;
		team.matches = team.matches.map(function(match,i){
			var isHome = match.HomeTeam === team.team ? true : false

			if(match.FTR === "H"){
				match.lostPoints = isHome ? 0 : 3;
			}else if(match.FTR === "D"){
				match.lostPoints = 2;
			}else if(match.FTR === "A"){
				match.lostPoints = isHome ? 3 : 0;
			}

			total = total - match.lostPoints;
			team.points.push({
				team:team.team,
				total:total
			})

			return match
		});
	})

	init();
})
}








function init(){
	var currentOffset = window.innerWidth/2;
	var width = 1200;
	var height = 1200;

	var yScale = d3.scale.linear()
		.domain([0,34*3])
		.range([height,0])

	var xScale = d3.scale.linear()
		.domain([0,34])
		.range([0,width])

	var line = d3.svg.line()
		.x(function(d,i) { return xScale(i)})
		.y(function(d,i) {
			return yScale(d.total)
		})
		// .interpolate("monotone")

	var svg = d3.select('svg').attr('height',height).attr('width',width).append('g').attr('class','lineContainer');

	svg.attr('transform','translate(' + currentOffset + ',20)')

	var container = svg.selectAll('g.team').data(matchesByTeam)
		.enter()
		.append('g')
		.attr('data-team',function(d){
			return d.team
		})

	container.selectAll('circle')
		.data(function(d){
			return d.points
		})
		.enter()
		.append('circle')
		.attr('cx',function(d,i){
			return xScale(i)
		})
		.attr('cy',function(d,i){
			return yScale(d.total)
		})
		.attr('r',2)
		.attr('fill','rgba(0,0,0,0.2)')

	container.append('path')
		.attr('stroke-width','1')
		.attr('stroke',function(d){
			if(d.team === "Feyenoord"){
				return "red"
			}else{
				return "#333"
			}
		})
		.attr('fill','none')
		.datum(function(d){
			return d.points
		})
		.attr('d',line)

	var labels = d3.select('#labels').selectAll('.label')
		.data(matchesByTeam)
		.enter()
		.append('div')
		.attr('data-team',function(d){
			return d.team
		})
		.attr('class',function(d){
			return "label " + d.team
		})
		.text(function(d){
			return d.team
		})

	// labels.append('img')
	// 	.attr('src',function(d){
	// 		return "logos/" + d.team + ".png"
	// 	})

	function updateLabels(round){
		var positions = [];
		labels
			.transition()
			.duration(speed)
			.ease('linear')
			.attr('style',function(d){
				var isDouble = "left: 5px;";
				var currentPoints = d.points[round].total

				var isThere = positions.filter(function(e){
					return e === currentPoints
				}).length;

				isDouble = "left:" + ((120*isThere) + 5) +  "px;"

				positions.push(currentPoints);

				return "top: " + (yScale(currentPoints) + 12) + "px; " + isDouble;
			})
	}

	function moveLines(round){
		setTimeout(function(){
			if(round < matchesByTeam[0].points.length){
				currentOffset -= width/34
				svg.transition().duration(speed).ease('linear').attr('transform','translate(' + currentOffset + ',20)');



				round++;
				updateLabels(round);
				moveLines(round);
			}
		},speed)
	}

	function showGuides(){

		for(i=0; i<34*3; i++){
			svg.append('line')
				.attr('stroke-width', "1")
				.attr('stroke','rgba(0,0,0,0.1)')
				.attr('x1',0)
				.attr('x2',width)
				.attr('y1',yScale(34*3-i))
				.attr('y2',yScale(34*3-i))
		}
	}

	moveLines(0);
	updateLabels(0);
	showGuides();

	$('#labels div').on('mouseover',function(){
		var team = $(this).data('team');

		$('#screen .lineContainer g').attr('opacity',0.1);
		$('#screen g[data-team="' + team + '"]').attr('opacity',1);
	})

	$('#labels div').on('mouseleave',function(){
		$('#screen .lineContainer g').attr('opacity',1);
	})
}
