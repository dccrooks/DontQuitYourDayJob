$(function () {
    $.ajaxSetup({cache: false});

    $("#league").selectmenu({width: "70%"});
    $("#season").selectmenu({width: "70%"});
    $("#type").selectmenu({width: "70%"});
    $("#window").selectmenu({width: "70%"});
    $("#dogs").selectmenu({width: "70%"});
    $("#threshold").selectmenu({width: "70%"});
    $("#simulate").button();

    var scraper = document.location.pathname.includes("scraper");

    $("document").ready(function () {
        updateDropdown("#league");
        var caption = toggleIntro(0);

        $("#next").click(function () {
            caption = toggleIntro(caption);
        });

        $("#league").on("selectmenuchange", function () {
            updateDropdown("#season");
        });

        $("#season").on("selectmenuchange", function () {
            updateDropdown("#type");
        });

        $("#simulate").click(function () {
            simulate();
        });
    });

    function updateDropdown(id) {
        var path = scraper ? "../data/raw/" : "../data/scraped/";
        var order;

        switch (id) {
            case "#league":
                order = 1;
                break;
            case "#season":
                path += $("#league").val();
                order = 1;
                break;
            case "#type":
                path += $("#league").val() + "/" + $("#season").val();
                order = 0;
                break;
        }

        $.ajax({
            async: false,
            url: "php/scandir.php",
            data: ({
                path: path,
                order: order
            }),
            success: function (options) {
                options = options.split(",");
                options.pop();
                $(id).empty();

                for (var i = 0; i < options.length; i++) {
                    $(id).append("<option value='" + options[i] + "'>" + options[i].toUpperCase() + "</option>");
                }

                $(id).selectmenu("refresh");
            },
            error: function () {
                alert("Error scanning directories in " + path);
            }
        });

        switch (id) {
            case "#league":
                updateDropdown("#season");
                break;
            case "#season":
                updateDropdown("#type");
                break;
            case "#type":
                break;
        }
    }

    function drawChart(opener, closer) {
        Highcharts.chart('chart', {
            chart: {
                type: 'areaspline',
                backgroundColor: 'transparent',
                style: {
                    fontFamily: 'var(--font-family)'
                }
            },
            title: {
                text: $("#league").val().toUpperCase() + " " + $("#season").val() + " SEASON",
                style: {
                    color: 'var(--primary)',
                    fontSize: '2em'
                }
            },
            subtitle: {
                text: $("#type").val().toUpperCase(),
                style: {
                    color: 'var(--secondary)',
                    fontSize: '1.5em'
                }
            },
            credits: {
                enabled: false
            },
            xAxis: {
                title: {
                    text: 'RISK $'
                }
            },
            yAxis: {
                title: {
                    text: 'TO WIN $'
                },
                gridLineColor: 'var(--lighter)'
            },
            legend: {
                itemStyle: {
                    color: 'var(--text)',
                    fontSize: '1.5em'
                },
                itemHoverStyle: {
                    color: 'var(--primary)'
                },
                itemHiddenStyle: {
                    color: 'var(--lighter)'
                }
            },
            tooltip: {
                crosshairs: true,
                backgroundColor: "rgba(12, 12, 12, 0.5)",
                style: {
                    color: 'var(--text)'
                },
                useHTML: true,
                formatter: function () {
                    return '<span style="color:' + this.point.color + '; font-size: 1.5em;">' + this.series.name + '</span>'
                            + '<br><span style="color: var(--secondary);">RISK:</span> $' + this.x.toFixed(2)
                            + '<br><span style="color: var(--secondary);">TO WIN:</span> $' + this.y.toFixed(2);
                }
            },
            series: [{
                    data: opener,
                    name: 'OPENING LINES',
                    //color: '#84D2F6',
                    marker: {
                        enabled: false
                    }
                }, {
                    data: closer,
                    name: 'CLOSING LINES',
                    color: '#1F497D',
                    //color: '#386FA4',
                    marker: {
                        enabled: false
                    }
                }]
        });
    }

    function exportData(games) {
        var path = "../data/scraped/" + $("#league").val() + "/" + $("#season").val() + "/" + $("#type").val();
        var csv = "";

        for (var i = 0; i < games.length; i++) {
            csv += games[i].date + ","
                    + games[i].away.team + ","
                    + games[i].home.team + ","
                    + games[i].away.score + ","
                    + games[i].home.score + ","
                    + games[i].away.opener.line + ","
                    + games[i].away.opener.odds + ","
                    + games[i].home.opener.line + ","
                    + games[i].home.opener.odds + ","
                    + games[i].away.closer.line + ","
                    + games[i].away.closer.odds + ","
                    + games[i].home.closer.line + ","
                    + games[i].home.closer.odds + "\r\n";
        }

        $.post("php/write.php", {
            path: path,
            txt: csv
        });
    }

    function loadScraped() {
        var path = "data/scraped/" + $("#league").val() + "/" + $("#season").val() + "/" + $("#type").val() + "/data.csv";
        var games = [];

        $.ajax({
            async: false,
            url: path,
            success: function (data) {
                data = data.split('\n');
                data.pop();

                for (var i = 0; i < data.length; i++) {
                    var game = data[i].split(",");

                    games.push({
                        date: game[0],
                        away: {
                            team: game[1],
                            score: parseInt(game[3]),
                            opener: {
                                line: parseFloat(game[5]),
                                odds: parseInt(game[6])
                            },
                            closer: {
                                line: parseFloat(game[9]),
                                odds: parseInt(game[10])
                            }
                        },
                        home: {
                            team: game[2],
                            score: parseInt(game[4]),
                            opener: {
                                line: parseFloat(game[7]),
                                odds: parseInt(game[8])
                            },
                            closer: {
                                line: parseFloat(game[11]),
                                odds: parseInt(game[12])
                            }
                        }
                    });
                }
            },
            error: function () {
                alert("Error loading " + path);
            }
        });

        return games;
    }

    function loadFiles() {
        var path = "data/raw/" + $("#league").val() + "/" + $("#season").val() + "/" + $("#type").val() + "/";
        var files = [];
        var filenames;

        $.ajax({
            async: false,
            url: "php/scandir.php",
            data: ({
                path: "../" + path,
                order: 0
            }),
            success: function (data) {
                filenames = data.split(",");
                filenames.pop();
            },
            error: function () {
                alert("Error scanning files in " + path);
            }
        });

        for (var i = 0; i < filenames.length; i++) {
            $.ajax({
                async: false,
                url: path + filenames[i],
                success: function (data) {
                    files.push({
                        date: filenames[i].replace(".mhtml", ""),
                        source: cleanUp(data)
                    });
                },
                error: function () {
                    alert("Error loading " + path + filenames[i]);
                }
            });
        }

        return files;
    }

    function scrapeFiles(files) {
        var games = [];
        var mlb = $("#league").val() == "mlb" ? true : false;

        for (var i = 0; i < files.length; i++) {
            var teams = scrapeField(files[i].source, !mlb ? /3O1Gx">[^<]+/g : /odds\/"><div>[^<]+/g);
            var scores = scrapeField(files[i].source, /1TdDD undefined"><div>[^<]+/g);
            var opener_lines = scrapeField(files[i].source, / opener">[^<]+/g);
            var opener_odds = scrapeField(files[i].source, /"opener">[^<]+/g);
            var closers = scrapeClosers(files[i].source);
            var closer_lines = closers[0];
            var closer_odds = closers[1];

            for (var j = 0; j < teams.length; j += 2) {
                if (!isNaN(scores[j]) && !isNaN(scores[j + 1])) {
                    games.push({
                        date: files[i].date,
                        away: {
                            team: teams[j],
                            score: parseInt(scores[j]),
                            opener: {
                                line: parseFloat(opener_lines[j]),
                                odds: parseInt(opener_odds[j])
                            },
                            closer: {
                                line: parseFloat(closer_lines[j]),
                                odds: parseInt(closer_odds[j])
                            }
                        },
                        home: {
                            team: teams[j + 1],
                            score: parseInt(scores[j + 1]),
                            opener: {
                                line: parseFloat(opener_lines[j + 1]),
                                odds: parseInt(opener_odds[j + 1])
                            },
                            closer: {
                                line: parseFloat(closer_lines[j + 1]),
                                odds: parseInt(closer_odds[j + 1])
                            }
                        }
                    });
                }
            }
        }

        return games;
    }

    function cleanUp(source) {
        source = source.replace(/=\r\n/g, "");
        source = source.replace(/=C2=BD/g, ".5");
        source = source.replace(/PK/g, "0");

        return source;
    }

    function scrapeField(source, pattern) {
        var matches = source.match(pattern);
        matches = matches != null ? matches : [];

        for (var i = 0; i < matches.length; i++) {
            matches[i] = matches[i].substring(matches[i].lastIndexOf(">") + 1);
        }

        return matches;
    }

    function scrapeClosers(source) {
        var pattern = /sbid=3D"93".+?<\/section>/g;
        var matches = source.match(pattern);
        var lines = [];
        var odds = [];

        for (var i = 0; i < matches.length; i++) {
            var matches_lines = scrapeField(matches[i], /3Nv_7">[^<]+/g);
            lines.push(matches_lines[0]);
            lines.push(matches_lines[1]);

            var matches_odds = scrapeField(matches[i], /3D"">[^<]+/g);
            odds.push(matches_odds[0]);
            odds.push(matches_odds[1]);
        }

        return [lines, odds];
    }

    function processData(games) {
        var window = $("#window").val();
        var dogs = $("#dogs").val();
        var threshold = $("#threshold").val();

        for (var i = 0; i < games.length; i++) {
            var away_games = 0;
            var home_games = 0;
            var away_ps = 0;
            var away_pa = 0;
            var home_ps = 0;
            var home_pa = 0;
            var away_opener_ip = 0;
            var away_closer_ip = 0;
            var home_opener_ip = 0;
            var home_closer_ip = 0;

            for (var j = 0; j < i; j++) {
                if (games[i].away.team == games[j].away.team) {
                    away_games++;
                    away_ps += games[j].away.score;
                    away_pa += games[j].home.score;
                    away_opener_ip += oddsToProbability(games[j].away.opener.odds);
                    away_closer_ip += oddsToProbability(games[j].away.closer.odds);
                }

                if (games[i].away.team == games[j].home.team) {
                    away_games++;
                    away_ps += games[j].home.score;
                    away_pa += games[j].away.score;
                    away_opener_ip += oddsToProbability(games[j].home.opener.odds);
                    away_closer_ip += oddsToProbability(games[j].home.closer.odds);
                }

                if (games[i].home.team == games[j].away.team) {
                    home_games++;
                    home_ps += games[j].away.score;
                    home_pa += games[j].home.score;
                    home_opener_ip += oddsToProbability(games[j].away.opener.odds);
                    home_closer_ip += oddsToProbability(games[j].away.closer.odds);
                }

                if (games[i].home.team == games[j].home.team) {
                    home_games++;
                    home_ps += games[j].home.score;
                    home_pa += games[j].away.score;
                    home_opener_ip += oddsToProbability(games[j].home.opener.odds);
                    home_closer_ip += oddsToProbability(games[j].home.closer.odds);
                }
            }

            games[i].away.ppg = away_ps / away_games;
            games[i].home.ppg = home_ps / home_games;
            games[i].away.papg = away_pa / away_games;
            games[i].home.papg = home_pa / home_games;

            away_opener_ip /= away_games;
            home_opener_ip /= home_games;
            away_closer_ip /= away_games;
            home_closer_ip /= home_games;

            games[i].away.opener.value = probabilityToPrice((away_opener_ip + (1 - home_opener_ip)) / 2);
            games[i].home.opener.value = probabilityToPrice((home_opener_ip + (1 - away_opener_ip)) / 2);
            games[i].away.closer.value = probabilityToPrice((away_closer_ip + (1 - home_closer_ip)) / 2);
            games[i].home.closer.value = probabilityToPrice((home_closer_ip + (1 - away_closer_ip)) / 2);

            games[i].away.opener.price = oddsToPrice(games[i].away.opener.odds);
            games[i].home.opener.price = oddsToPrice(games[i].home.opener.odds);
            games[i].away.closer.price = oddsToPrice(games[i].away.closer.odds);
            games[i].home.closer.price = oddsToPrice(games[i].home.closer.odds);

            games[i].away.opener.stake = 0;
            games[i].home.opener.stake = 0;
            games[i].away.closer.stake = 0;
            games[i].home.closer.stake = 0;

            games[i].away.opener.profit = 0;
            games[i].home.opener.profit = 0;
            games[i].away.closer.profit = 0;
            games[i].home.closer.profit = 0;

            if (window == "full" || (window == "half" && i > games.length / 2)) {
                if (dogs == "off" || (dogs == "on" && games[i].away.opener.price >= games[i].home.opener.price)) {
                    if (games[i].away.opener.price / games[i].away.opener.value <= threshold) {
                        games[i].away.opener.stake = games[i].away.opener.price;
                        games[i].away.opener.profit = games[i].away.score > games[i].home.score ? 1 : -games[i].away.opener.price;
                    }
                }

                if (dogs == "off" || (dogs == "on" && games[i].home.opener.price >= games[i].away.opener.price)) {
                    if (games[i].home.opener.price / games[i].home.opener.value <= threshold) {
                        games[i].home.opener.stake = games[i].home.opener.price;
                        games[i].home.opener.profit = games[i].home.score > games[i].away.score ? 1 : -games[i].home.opener.price;
                    }
                }

                if (dogs == "off" || (dogs == "on" && games[i].away.closer.price >= games[i].home.closer.price)) {
                    if (games[i].away.closer.price / games[i].away.closer.value <= threshold) {
                        games[i].away.closer.stake = games[i].away.closer.price;
                        games[i].away.closer.profit = games[i].away.score > games[i].home.score ? 1 : -games[i].away.closer.price;
                    }
                }

                if (dogs == "off" || (dogs == "on" && games[i].home.closer.price >= games[i].away.closer.price)) {
                    if (games[i].home.closer.price / games[i].home.closer.value <= threshold) {
                        games[i].home.closer.stake = games[i].home.closer.price;
                        games[i].home.closer.profit = games[i].home.score > games[i].away.score ? 1 : -games[i].home.closer.price;
                    }
                }
            }
        }
    }

    function updateChart(games) {
        var opener = [];
        var closer = [];
        var opener_stake = 0;
        var opener_profit = 0;
        var closer_stake = 0;
        var closer_profit = 0;

        for (var i = 0; i < games.length; i++) {
            if (games[i].away.opener.stake > 0) {
                opener_stake += games[i].away.opener.stake;
                opener_profit += games[i].away.opener.profit;
                opener.push([opener_stake, opener_profit]);
            }

            if (games[i].home.opener.stake > 0) {
                opener_stake += games[i].home.opener.stake;
                opener_profit += games[i].home.opener.profit;
                opener.push([opener_stake, opener_profit]);
            }

            if (games[i].away.closer.stake > 0) {
                closer_stake += games[i].away.closer.stake;
                closer_profit += games[i].away.closer.profit;
                closer.push([closer_stake, closer_profit]);
            }

            if (games[i].home.closer.stake > 0) {
                closer_stake += games[i].home.closer.stake;
                closer_profit += games[i].home.closer.profit;
                closer.push([closer_stake, closer_profit]);
            }
        }

        drawChart(opener, closer);
    }

    function simulate() {
        $("main").html("");
        $("#intro").css("margin-left", "calc(var(--nav-width) / 2)");
        $("#caption").hide();
        $("#caption").html("<span class='red'>[</span> scraping data <span class='red'>]</span>");

        setTimeout(function () {
            $("#caption").fadeIn(1000);

            setTimeout(function () {
                if (scraper) {
                    var games = scrapeFiles(loadFiles());
                    exportData(games);
                } else {
                    games = loadScraped();
                }

                processData(games);
                updateChart(games);
                $("#caption").hide();
            }, 1000);
        }, 1);
    }

    function printData(games) {
        var table = "<table><tr>";
        table += "<th rowspan='2'>DATE</th>";
        table += "<th rowspan='2'>TEAM</th>";
        table += "<th rowspan='2'>SCORE</th>";
        table += "<th rowspan='2'>PPG</th>";
        table += "<th rowspan='2'>PAPG</th>";
        table += "<th colspan='6'>OPENER</th>";
        table += "<th colspan='6'>CLOSER</th>";
        table += "</tr><tr>";
        table += "<th>LINE</th>";
        table += "<th>ODDS</th>";
        table += "<th>PRICE</th>";
        table += "<th>VALUE</th>";
        table += "<th>STAKE</th>";
        table += "<th>PROFIT</th>";
        table += "<th>LINE</th>";
        table += "<th>ODDS</th>";
        table += "<th>PRICE</th>";
        table += "<th>VALUE</th>";
        table += "<th>STAKE</th>";
        table += "<th>PROFIT</th>";
        table += "</tr>";

        for (var i = 0; i < games.length; i++) {
            var tr_class = i % 2 == 0 ? "" : "highlight";

            table += "<tr class='" + tr_class + "'>";
            table += "<td>" + games[i].date + "</td>";
            table += "<td>" + games[i].away.team + "<br>" + games[i].home.team + "</td>";
            table += "<td>" + games[i].away.score + "<br>" + games[i].home.score + "</td>";
            table += "<td>" + games[i].away.ppg.toFixed(1) + "<br>" + games[i].home.ppg.toFixed(1) + "</td>";
            table += "<td>" + games[i].away.papg.toFixed(1) + "<br>" + games[i].home.papg.toFixed(1) + "</td>";
            table += "<td>" + games[i].away.opener.line + "<br>" + games[i].home.opener.line + "</td>";
            table += "<td>" + games[i].away.opener.odds + "<br>" + games[i].home.opener.odds + "</td>";
            table += "<td>" + games[i].away.opener.price.toFixed(2) + "<br>" + games[i].home.opener.price.toFixed(2) + "</td>";
            table += "<td>" + games[i].away.opener.value.toFixed(2) + "<br>" + games[i].home.opener.value.toFixed(2) + "</td>";
            table += "<td>" + games[i].away.opener.stake.toFixed(2) + "<br>" + games[i].home.opener.stake.toFixed(2) + "</td>";
            table += "<td>" + games[i].away.opener.profit.toFixed(2) + "<br>" + games[i].home.opener.profit.toFixed(2) + "</td>";
            table += "<td>" + games[i].away.closer.line + "<br>" + games[i].home.closer.line + "</td>";
            table += "<td>" + games[i].away.closer.odds + "<br>" + games[i].home.closer.odds + "</td>";
            table += "<td>" + games[i].away.closer.price.toFixed(2) + "<br>" + games[i].home.closer.price.toFixed(2) + "</td>";
            table += "<td>" + games[i].away.closer.value.toFixed(2) + "<br>" + games[i].home.closer.value.toFixed(2) + "</td>";
            table += "<td>" + games[i].away.closer.stake.toFixed(2) + "<br>" + games[i].home.closer.stake.toFixed(2) + "</td>";
            table += "<td>" + games[i].away.closer.profit.toFixed(2) + "<br>" + games[i].home.closer.profit.toFixed(2) + "</td>";
            table += "</tr>";
        }

        table += "</table>";
        table += "<br>" + games.length;

        $("main").html(table);
    }

    function oddsToProbability(odds) {
        if (odds < 0) {
            return -odds / (-odds + 100);
        } else {
            return 100 / (odds + 100);
        }
    }

    function probabilityToPrice(probability) {
        return 1 / (1 / probability - 1);
    }

    function oddsToPrice(odds) {
        if (odds < 0) {
            return 1 / ((-odds + 100) / -odds - 1);
        } else {
            return 1 / ((odds + 100) / 100 - 1);
        }
    }

    function toggleIntro(caption) {
        var timeout = 0;

        if (caption > 0) {
            $("#caption, #next").fadeOut(1000);
            timeout = 1000;
        } else {
            $("#caption, #next").hide();
        }

        caption++;

        setTimeout(function () {
            var text;

            switch (caption) {
                case 1:
                    text = "i wanted to see if you could beat sportsbooks simply by using their own lines against them.<br><br>";
                    text += "no sports knowledge required, no emotional component, <span class='red'>just numbers</span>.";
                    break;
                case 2:
                    text = "for example:<br><br>";
                    text += "in weeks 1-15, the average price to bet on teamX was <span>$2.00</span> to win $1.00.<br>";
                    text += "in week 16, teamX is priced at only <span class='red'>$1.80</span> to win $1.00.<br><br>";
                    text += "because the bet is cheaper (<span class='red'>$1.80</span>) than what the team is worth (<span>$2.00</span>),<br>";
                    text += "<span class='red'>bet on teamX</span> in week 16.";
                    break;
                case 3:
                    text = "an oversimplification of the actual calculation, but that's the gist.";
                    break;
                case 4:
                    text = "conditions can be set to increase profitability, such as:<br><br>";
                    text += "<span class='red'>•</span> only bet on favorites, no dogs<br>";
                    text += "<span class='red'>•</span> only bet in the second half of the season<br>";
                    text += "<span class='red'>•</span> only bet on teams priced at least 20% off of their value<br>";
                    break;
                case 5:
                    text = "this application simulates the profitability of individual sports seasons had the prescribed betting system been followed.<br><br>";
                    text += "summary of findings:";
                    break;
                case 6:
                    $("#caption").css("text-align", "center");
                    text = "<span id='logo'>don't quit your day job.</span><br><br>";
                    text += "html <span class='red'>•</span> css <span class='red'>•</span> javascript <span class='red'>•</span> jquery <span class='red'>•</span> regex scraping <span class='red'>•</span> ajax <span class='red'>•</span> php <span class='red'>•</span> highcharts";
                    break;
                default:
                    text = "";
                    $("#next").html("");
                    $("nav").css("left", "0");
                    break;
            }

            $("#caption").html(text);
        }, timeout);

        $("#caption, #next").fadeIn(1000);

        return caption;
    }
});