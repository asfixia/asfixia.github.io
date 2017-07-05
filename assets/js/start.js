var dataset = [];
document.addEventListener('DOMContentLoaded', function () {
    d3.dsv(",", "text/plain")("https://rawgit.com/danilomalzao/teste/master/leilaoxmercado/dump.csv?v5", function (leilao) {
        dataset = leilao.map(function (val) {val.source = 1; return val});
        d3.dsv(",", "text/plain")("https://rawgit.com/danilomalzao/teste/master/leilaoxmercado/dump_zap.csv?v9", function (mercado) {
            dataset = dataset.concat(mercado.map(function (val) {val.source = 2; return val}));
            function redraw(start) {
                var activeFolder = start / qntItem;
                d3.select("#buttons").selectAll('a').classed('active_link', function (d, i) {
                    return d3.select("table").select('tbody').selectAll("tr").size() > 0
                        && i == (activeFolder + 1);
                });
                d3.select("table").select('tbody').selectAll("tr")
                    .style("display", function (d, i) {
                        return (i >= start && i < start + qntItem) ? null : "none";
                    })
            };

            var qntItem = 20;
            var head = {
                // coord_x,coord_y,size,address,price,type,regiao_id,bairro,farmac_dist,mercado_dist,restaurante_dist
                "Tipo": "type",
                "Preço (R$)": "price",
                "Area m²": "size",
                Bairro: "bairro",
                "Farmácia próxima": "farmac_dist",
                "Mercado próximo": "mercado_dist",
                "Restaurante próximo": "restaurante_dist",
                Região: "regiao_id",
                Endereço: "address"
            };
            //1: left, 2: center, 3: right, 4: justify
            var headAlign = {
                Endereço: 2,
                Tamanho: 1,
                "Tipo de Imóvel": 1,
                Preço: 1,
                Bairro: 2,
                Região: 1,
                "Farmácia": 1,
                "Mercado": 1,
                "Restaurante": 1
            };
            var sizeMD = {
                //Ano: 1,
                // Dia: 2,
                // Turno: 1,
                // Bairro: 2,
                // Lugar: 3,
                // Marca: 3
            };
            var formatField = {
                "farmac_dist": function (dist) {
                    return (dist * 1000) + "m";
                },
                "mercado_dist": function (dist) {
                    return (dist * 1000) + "m";
                },
                "restaurante_dist": function (dist) {
                    return (dist * 1000) + "m";
                },
                "price": function (price) {
                    return price + "k";
                },
                "size": function (size) {
                    return parseInt(size) ? (size + "m²") : "Não informado";
                },
                "bairro": function (bairro) {
                    return bairro || "Não informado";
                },
                "regiao_id": function (regId, data) {
                    var regions = {
                        1: "BARREIRO",
                        2: "CENTRO-SUL",
                        3: "LESTE",
                        4: "NORDESTE",
                        5: "NOROESTE",
                        6: "NORTE",
                        7: "OESTE",
                        8: "PAMPULHA",
                        9: "VENDA NOVA",
                        "-1": "REGIAO_METROPOLITANA"
                    };
                    return regions[regId] || "REGIAO_METROPOLITANA";
                },
                "type": function (type, data) {
                    return ((type == 3 || type == 4) ? "Apartamento" : "Casa") + " - "
                        + (data.source == 1 ? "Leilão" : "Mercado");
                },
                DATAOCORRENCIA: function (date) {
                    var regex = /([0-9]{1,2})[\\\/-]([0-9]{1,2})[\\\/-]([0-9]{4})/g;
                    var m;
                    if ((m = regex.exec(date)) !== null) {
                        // This is necessary to avoid infinite loops with zero-width matches
                        if (m.index === regex.lastIndex) {
                            regex.lastIndex++;
                        }
                        date = m[3] + "/" + m[2] + "/" + m[1];
                    }
                    return date;
                }
            };
            var ordHead = {
                hName: Object.keys(head)[0],
                asc: true
            };
            var portion = 0;
            var search = "";

            for (var iData = 0, lenData = dataset.length, fieldKeys = Object.keys(formatField); iData < lenData; iData++) {
                var curData = dataset[iData];
                for (var iField = 0, lenField = fieldKeys.length; iField < lenField; iField++)
                    dataset[iData][fieldKeys[iField]] = formatField[fieldKeys[iField]](dataset[iData][fieldKeys[iField]], dataset[iData]);
            }

            var sortByColumn = (function (dataset, head) {
                return function sortByColumn(name, hName) {
                    if (ordHead.hName == hName)
                        ordHead.asc = !ordHead.asc;
                    else {
                        ordHead.hName = hName;
                        ordHead.asc = true;
                    }
                    dataset.sort(function (a, b) {
                        var aName = (a[name] && a[name].trim()) || "";
                        var bName = (b[name] && b[name].trim()) || "";
                        var val;
                        if ($.isNumeric(aName) && $.isNumeric(bName))
                            val = aName - bName;
                        else if (aName == bName)
                            val = 0;
                        else
                            val = aName > bName ? 1 : -1;
                        return (ordHead.asc) ? val : -val;
                    });
                    bindToData(dataset, head);
                    portion = 0;
                    redraw(0);
                }
            })(dataset, head);

            sortByColumn(head[ordHead.hName], ordHead.hName);

            d3.select("input[name=search]").on("keyup", function () {
                if (this.value === undefined || this.value === false)
                    search = "";
                else
                    search = this.value;
                bindToData(dataset, head);
                portion = 0;
                redraw(0);
            });

            d3.select("select").on("change", function (dataset, head) {
                return function () {
                    qntItem = parseInt(this.options[this.selectedIndex].value);
                    portion = 0;
                    bindToData(dataset, head);
                    redraw(0);
                };
            }(dataset, head));

            d3.select("table").append('thead');
            d3.select("table").select('thead').append('tr');
            d3.select("table").append('tbody');

            function bindToData(dataset, head) {
                var _dataset = [];
                for (var iData = 0, lenData = dataset.length; iData < lenData; iData++) {
                    var contains = false;
                    var fullContent = "";
                    for (var iHead = 0, hKeys = Object.keys(head), lenHead = hKeys.length; iHead < lenHead; iHead++) {
                        fullContent += dataset[iData][head[hKeys[iHead]]] + "��";
                    }
                    if (search === "" || fullContent.toLowerCase().indexOf(search.toLowerCase()) != -1)
                        _dataset.push(dataset[iData]);
                }

                d3.select("table").select('thead').select('tr')
                    .selectAll('th').data([]).exit().remove();
                d3.select("table").select('thead').select('tr')
                    .selectAll('th').data(Object.keys(head))
                    .enter().append('th').on("click", function (d, i) {
                    return sortByColumn(head[d], d);
                })
                    .text(function (d) {
                        return d
                    })
                    .each(function (d, i) {
                        var curClass = this.className + " col-md-" + (Object.values(sizeMD)[i]) + " ";
                        if (ordHead.hName == d && ordHead.asc)
                            curClass += "fa fa-sort-amount-asc";
                        else if (ordHead.hName == d && !ordHead.asc)
                            curClass += "fa fa-sort-amount-desc";
                        else
                            curClass += "fa fa-sort";
                        this.className = curClass;
                    });

                d3.select("table").select('tbody')
                    .selectAll("tr").data([]).exit().remove();

                var tr = d3.select("table").select('tbody')
                    .selectAll("tr").data(_dataset);
                tr.enter().append("tr");
                tr.exit().remove();

                var td = d3.select("table").select('tbody')
                    .selectAll("tr").selectAll("td").data(function (d, i) {
                        function headToArr(d) {
                            var arr = [];
                            for (var hArr = Object.keys(head), i = 0;
                                 i < hArr.length; i++) {
                                arr.push(d[head[hArr[i]]]);
                            }
                            return arr;
                        };
                        return headToArr(d);
                    });
                td.enter().append("td")
                    .each(function (d, i) {
                        var curClass = this.className + " col-md-" + (Object.values(sizeMD)[i]) + " ";
                        switch (Object.values(headAlign)[i]) {
                            case 1:
                                curClass += "t_left";
                            case 2:
                                curClass += "t_center";
                            case 3:
                                curClass += "t_right";
                            case 4:
                                curClass += "t_justify";
                        }
                        this.className = curClass;
                    })
                    .text(function (d) {
                        return d;
                    });
                td.exit().remove();

                createIndex(_dataset.length);
            };

            bindToData(dataset, head);


            function createIndex(dataQnt) {
                d3.select("#buttons").selectAll("a").data([]).exit().remove();
                // the chain select here pushes the datum onto the up and down buttons also
                d3.select("#buttons").append("a").on("click", function () {
                    portion -= qntItem;
                    if (portion < 0)
                        portion = 0;
                    redraw(portion);
                })
                    .attr("href", "#")
                    .html(" &lt;&lt; ");

                for (var i = 0, iLen = Math.floor(dataQnt / qntItem); dataQnt > 0 && i <= iLen; i++) {
                    d3.select("#buttons").append("a").on("click", (function (i) {
                        return function () {
                            portion = i * qntItem;
                            redraw(portion);
                        };
                    })(i))
                        .attr("href", "#")
                        .html(" " + (i + 1) + " ");
                }

                d3.select("#buttons").append("a").on("click", function (d) {
                    portion += qntItem;
                    if (dataQnt - portion < 0)
                        portion -= qntItem;
                    redraw(portion);
                })
                    .attr("href", "#")
                    .html(" &gt;&gt; ");
            }

            redraw(0);
        })
    });
}, false);

function applyEffects() {
    $(document).on("scroll", function onScroll(event){
        var scrollPos = $(document).scrollTop();
        $('nav.navbar a').each(function () {
            var currLink = $(this);
            var refElement = $(currLink.attr("href"));
            if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
                $('nav.navbar a').removeClass("refactive");
                currLink.addClass("refactive");
            } else{
                currLink.removeClass("refactive");
            }
        });
    });
}
applyEffects();