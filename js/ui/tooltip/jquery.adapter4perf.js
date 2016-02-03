(function($) {

	var configs = {},
		tooltips = {},
		loadrecs = {},//数据加载记录
		status = {//加载状态：false - 失败, true - 成功, null - 未加载
			kpi: null,//性能指标的加载状态
			event: null,//告警指标的加载状态
			avail: null//可用性指标家在状态
		};

	$.topology.ui.tooltip = {
		init: function() {
			$.topology.ui.tooltip.reset();
			var objectClass = null, context, config = null;
			for ( objectClass in $.topology.config.context ) {
				context = $.topology.config.context[objectClass];
				config = context && context["TOOLTIP"];
				if (config) {
					configs[objectClass] = {
						tooltip : config,
						config : $.topology.config.kpi[objectClass]
					};
				}
			}
		},
		data: function(options) {//性能数据获取后的通知接口
			resetDataStatus(options);
			var id = null, opts = null, disp = null;
			for (id in tooltips) {
				if ($.tooltip("existed", id)) {
					opts = $.tooltip("options", id);
					disp = opts._status.display;
					if (!loadrecs[id] && (disp !== "hide")) {
						if (disp === "showing") {
							(function(id, opts) {
								setTimeout(function() {
									$.topology.ui.tooltip.reload(id);
								}, opts.showAnimateDelay + opts.showAnimateTime);
							}).call(null, id, opts);
						} else {
							$.topology.ui.tooltip.reload(id);
						}
					}
				}
			}
		},
		show: function(id, x, y) {
			$.topology.ui.tooltip.get(id);
			if ($.tooltip("existed", id)
					&& tooltips[id] && !tooltips[id].data("nodata")) {
				var offset = $($.tooltip("options", id).parent).offset();
				$.tooltip("show", id, { left: x - offset.left, top: y - offset.top });
			}
		},
		hide: function(id) {
			if ($.tooltip("existed", id)) {
				$.tooltip("hide", id);
			}
		},
		move: function(id, x, y) {
			if ($.tooltip("existed", id)
					&& tooltips[id] && !tooltips[id].data("nodata")) {
				var offset = $($.tooltip("options", id).parent).offset();
				$.tooltip("move", id, { left: x - offset.left, top: y - offset.top });
			}
		},
		reset: function() {
			var id = null;
			for (id in configs) {
				delete configs[id];
			}
			for (id in tooltips) {
				if ($.tooltip("existed", id)) {
					$.tooltip("destroy", id);
				}
			}
			tooltips = {};
			loadrecs = {};
			status = { kpi: null, event: null, avail: null };
		},
		reload: function(id, o) {
			o = o || getObjectById(id);
			var $tooltip = tooltips[id];
			if ($tooltip && o) {
				loadrecs[id] = false;
				if (o.kpis && (status.kpi || status.event || status.avail)) {//数据存在则直接加载
					$.topology.ui.tooltip._loadData(id, o);
				} else {//定时器方式加载
					var task = function() {
						var _callee = arguments.callee,
							params = _callee.params,
							id = params.id,
							o = params.symbol,
							$tooltip = params.target;
						if (status.kpi === true || status.event === true || status.avail === true) {
							clearInterval(_callee.timer);
							_callee.timer = null;
							if (o.kpis) {
								$.topology.ui.tooltip._loadData.call($.topology.ui.tooltip, id, o);
							} else {
								changeTooltipContent(id, " &nbsp;暂时无法获取数据.");
								$tooltip.data("nodata", true);
							}
						} else if (status.kpi === false || status.event === false || status.avail === false || ++_callee.count > 100) {
							clearInterval(_callee.timer);
							_callee.timer = null;
							if ($.tooltip("existed", id)) {//可能被移除
								$.tooltip("clear", id);
								var msg = " &nbsp;";
								if (_callee.count > 100) {
									msg += "加载超时";
								} else {
									msg +=  (status.event === false ? "告警" : (status.avail ? "可用性" : "性能")) + "数据加载失败.";
								}
								$.tooltip("addContent", id, msg);
							}
						}
					};
					task.params = {
						id: id,
						symbol: o,
						target: $tooltip
					};
					task.count = 0;
					task.timer = setInterval(task, 100);
				}
			}
		},
		get: function(id) {
			var o = getObjectById(id),
				objcls = getClass(o),
				cfg = configs[objcls],
				$tooltip = tooltips[id];
			if (!o) return null;
			if (!cfg) return null;
			if (!$tooltip) {
				$tooltip = $.tooltip({
					id : id,
					title: o.getName(),
					content: " &nbsp;数据加载中,请等待...",
					skin: "lightblue",
					width: "230px",
					parent: "#svgCanvas",
					offsetRight: 15,
					offsetBottom: 15,
					isMonitorSize: true,
					isPublicMonitor: false
				});
				tooltips[id] = $tooltip;
			}
			if (!loadrecs[id]) {
				this.reload(id, o);
			}
			return $tooltip;
		},
		/**
		 * 加载数据，内部方法，不对外提供
		 *     仅当数据加载成功后且kpis属性不为空时可以调用
		 *     kpis为空，会导致js报错
		 *     kpis不为空但数据加载标志不成功（上次的数据），会导致逻辑不正确
		 * @param id
		 * @param o
		 */
		_loadData: function(id, o) {
			o = o || getObjectById(id);
			if (!o.kpis) return;
			var objcls = getClass(o),
				cfg = configs[objcls],
				$tooltip = tooltips[id],
				$table = $.tooltip("getContent", id, ".tiptable"),
				kpiNames = cfg.tooltip.kpis.split(","),
				cvrNames = cfg.tooltip.converters.split(","),
				kpiName, cvrName, cvrCfg, val, cvr, parent, i,
				kpiZh, kpiUnit, nodata, tmpArr, reload, rowIndex = 0;
			if (!$table || $table.length === 0) {
				$table = $("<table/>").addClass("tiptable");
				$.tooltip("clear", id);
				$.tooltip("addContent", id, $table);
			}
			for (i = 0, nodata = true; i < kpiNames.length; i++) {
				reload = true;
				kpiName = kpiNames[i];
				val = o.kpis[kpiName];
				if (val == null || val === "") {//无数据
					$table.removeData(kpiName);
					tmpArr = $table.data(kpiName + "-rows");
					if (tmpArr) {
						$.each(tmpArr, function() {
							$(this).remove();
						});
					}
					continue;
				}
				cvrName = cvrNames[i];
				cvrCfg = $.topology.ui.converterConfig[cvrName];
				parent = $table.data(kpiName);
				kpiZh = cfg.config[kpiName].zhname;
				kpiUnit = cfg.config[kpiName].unit || "";
				nodata = false;
				if (!parent) {
					reload = false;
					parent = createDataRow(kpiName, cvrName, kpiZh, $table, rowIndex);
					$table.data(kpiName, parent);
				}
				tmpArr = $table.data(kpiName + "-rows");
				rowIndex += tmpArr ? tmpArr.length : 0;
				cvr = cvrCfg ? $.converter[cvrCfg.func] : null;
				if ($.isFunction(cvr)) {
					cvr.call($.converter, { value: val, unit: kpiUnit }, parent, reload);
				} else {
					parent.html(val + $.converter.unit(kpiUnit));
				}
			}
			if (nodata) {
				changeTooltipContent(id, " &nbsp;暂时无法获取数据.");
			}
			$tooltip.data("nodata", nodata);
			loadrecs[id] = true;
		}
	};

	function changeTooltipContent(id, msg) {
		if ($.tooltip("existed", id)) {
			$.tooltip("clear", id);
			if (msg) {
				$.tooltip("addContent", id, msg);
			}
		}
	}

	//需要单独一行显示指标值的转换器
	function createDataRow(kpiName, cvrName, kpiZh, $table, index) {
		var detailClass = "detail",
			arr = [],
			$tr = null,
			$div = null,
			style = bigWidgetStyle(cvrName),
			insert = function($tr) {
				if (index >= 0) {
					if (index - 1 < 0) {
						$table.prepend($tr);
					} else {
						$table.find(".tiptr:eq(" + (index - 1) + ")").after($tr);
					}
					index++;
				} else {
					$table.append($tr);
				}
			};
		if (style) {
			$tr = $("<tr/>").addClass("tiptr");
			$("<div/>").addClass(detailClass).append(kpiZh).appendTo(
					$("<td/>").addClass("tiptdleft2").attr("colspan", 2).appendTo($tr));
			insert($tr);
			arr.push($tr);

			$tr = $("<tr/>").addClass("tiptr");
			$div = $("<div/>").addClass(detailClass).css(style).appendTo(
					$("<td/>").addClass("tiptdright2").attr("colspan", 2).appendTo($tr));
			insert($tr);
			arr.push($tr);
		} else {
			var $tr = $("<tr/>").addClass("tiptr").appendTo($table);
			$("<div/>").addClass(detailClass).append(kpiZh).appendTo($("<td/>")
				.addClass("tiptdleft").appendTo($tr));
			$div = $("<div/>").addClass(detailClass).appendTo($("<td/>")
					.addClass("tiptdright").appendTo($tr));
			insert($tr);
			arr.push($tr);
		}
		$table.data(kpiName + "-rows", arr);
		return $div;
	}

	function getObjectById(id) {
		if (!id) return id;
		if ($.type(id) !== "object") {
			return $.topology.find(id);
		}
		return id;
	}

	function getClass(o) {
		o = getObjectById(o);
		if (!o) return null;
		return o.getObjectClass();
	}

	function resetDataStatus(options) {
		if (options) {
			if (options.kpi != null) {
				status.kpi = options.kpi;
			}
			if (options.event != null) {
				status.event = options.event;
			}
			if (options.avail != null) {
				status.avail = options.avail;
			}
			loadrecs = {};
		}
	}

	function bigWidgetStyle(name) {
		return {
			"PERCENT2GAUGE": {
				width: "180px",
				padding: "2px 20px"
			},
			"REVERSE_PERCENT2GAUGE": {
				width: "180px",
				padding: "2px 20px"
			},
			"TEMPERATURE": {
				width: "100px",
				padding: "2px 60px"
			}
		}[name];
	}

})(jQuery);