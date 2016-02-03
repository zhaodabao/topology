(function($) {

	var configs = null,
		tooltips = {},
		maxZIndex = 0,//当前置顶tooltip的z-index
		status = {//加载状态：false - 失败, true - 成功, null - 未加载
			kpi: null,//性能指标的加载状态
			event: null,//告警指标的加载状态
			avail: null//可用性指标家在状态
		},
		number = null,//当前拓扑图存在hang的个数
		viewCenterCoords = null,//当前视图中心点坐标，避免多次计算
		isNodeHang = false,//节点Hang是否开启
		isLineHang = false,//连线Hang是否开启
		isShowLabel = false,//是否显示Hang名称
		isNodeAdapter = false,//节点位置是否自适应
		nodeHangPos = 1;//节点Hang位置

	$.topology.ui.tooltip4hang = {
		/**
		 * 是否开启挂在模式
		 * 
		 * @param type 1:节点；2:连线
		 */
		isOpen: function(type) {
			return type == 1 ? isNodeHang : (type == 2 ? isLineHang : (isNodeHang || isLineHang));
		},
		/**
		 * 显示挂载控件
		 * 
		 * @param type 1:节点；2:连线
		 */
		open: function(type) {
			var _this = this;
			if (type != 1) {//连线
				if (!isLineHang) {
					isLineHang = true;
					_this.show(type);
				}
			}
			if (type != 2) {//节点
				if (!isNodeHang) {
					isNodeHang = true;
					_this.show(type);
				}
			}
		},
		/**
		 * 隐藏挂载控件
		 * 
		 * @param type 1:节点；2:连线
		 */
		close: function(type) {
			var _this = this;
			if (type != 1) {//连线
				if (isLineHang) {
					isLineHang = false;
					_this.hide(type);
				}
			}
			if (type != 2) {//节点
				if (isNodeHang) {
					isNodeHang = false;
					_this.hide(type);
				}
			}
		},
		/**
		 * 显示指标名称
		 */
		showLabel: function() {
			if (!isShowLabel) {
				isShowLabel = true;
				$.each(tooltips, function(i, $tooltip) {
					$tooltip.find(".hide").removeClass("hide");
				});
			}
		},
		/**
		 * 隐藏指标名称
		 */
		hideLabel: function() {
			if (isShowLabel) {
				isShowLabel = false;
				$.each(tooltips, function(i, $tooltip) {
					$tooltip.find(".tiptdleft,.tiptdleft2").addClass("hide");
				});
			}
		},
		/**
		 * 是否显示指标名称
		 */
		isShowLabel: function() {
			return isShowLabel;
		},
		/**
		 * 是否开启节点Hang位置自适应功能
		 */
		isNodeAdapter: function() {
			return isNodeAdapter;
		},
		/**
		 * 设置节点Hang自适应开关
		 * @param unadjust 设置开关后不做Hang位置的自适应操作
		 */
		setNodeAdapter: function(flag, unadjust) {
			isNodeAdapter = flag;
			!unadjust && this.adjust();
		},
		/**
		 * 开启节点Hang自适应开关
		 */
		getNodeHangPos: function() {
			return nodeHangPos;
		},
		/**
		 * 设置节点Hang的位置
		 * 
		 * @param idx 1：右；2：下；3：左；4：上
		 * @param unadjust 设置开关后不做Hang位置的自适应操作
		 */
		setNodeHangPos: function(idx, unadjust) {
			nodeHangPos = idx;
			!unadjust && this.adjust();
		},
		/**
		 * 当前视图hang个数
		 */
		number: function() {
			if (number == null) {
				number = 0;
				$.each([ "symbols", "containers", "lines", "lineseters" ], function(i, type) {
					var map = $.topology.shapes[type];
					$.each(map, function(id, o) {
						var cfg = configs[o.getObjectClass()];
						number += cfg ? 1 : 0;
					});
				});
			}
			return number;
		},
		/**
		 * 适应位置
		 */
		adjust: function(o) {
			var _this = this,
				id = null,
				fn = function(id, $tooltip) {
					var o = _this._getObjectById(id);
					if (_this.isOpen(_this.type(o)) && o.visible) {
						if (!$.topology.isContainer(o) && !$.topology.isLineseter(o) || !o.isExpand) {
							_this._showTooltip(id, $tooltip, $tooltip.data("nodata"));
						}
					}
				};
			if (arguments.length == 1) {
				o = _this._getObjectById(o);
				id = o && o.id;
			}
			if (id) {
				var $tooltip = tooltips[id];
				$tooltip && fn.call($tooltip, id, $tooltip);
			} else {
				$.each(tooltips, fn);
			}
		},
		type: function(o) {
			var _this = this;
			o = _this._getObjectById(o);
			return $.topology.isLine(o) || $.topology.isLineseter(o) ? 2 : 1;
		},
		/**
		 * 初始化指标配置
		 */
		init: function() {
			var _this = this,
				objectClass = null,
				context,
				config = null;
			_this.reset();
			configs = {};
			for ( objectClass in $.topology.config.context ) {
				context = $.topology.config.context[objectClass];
				config = context && context["HANG"];
				if (config) {
					configs[objectClass] = {
						hang : config,
						kpi : $.topology.config.kpi[objectClass]
					};
				}
			}
			$($.topology).off("drawElement.tooltip4hang")
				.on("drawElement.tooltip4hang", function(event, o) {
					if (!_this.isOpen(_this.type(o))) {
						return;
					}
					var id = o.id;
					if ($.topology.isContainer(o) || $.topology.isLineseter(o)) {//容器、线组器的展开、关闭
						var $tooltip = tooltips[id];
						if ($tooltip) {
							if (o.visible && !o.isExpand) {
								!$tooltip.data("nodata") && _this._showTooltip(id, $tooltip);
							} else {
								$.tooltip("hide", $tooltip);
							}
						}
					} else {//节点连线的显示隐藏
						var $tooltip = tooltips[id];
						if ($tooltip) {
							if (o.visible) {
								!$tooltip.data("nodata") && _this._showTooltip(id, $tooltip);
							} else {
								$.tooltip("hide", $tooltip);
							}
						}
					}
				});
			$($.topology.graphEngine.canvas).off("change.tooltip4hang")
				.on("change.tooltip4hang", function() {//缩放
					_this._countViewCenterCoords();
					$.each(tooltips, function(id, $tooltip) {
						if ($tooltip.is(":visible")) {
							var pos = _this._position(id);
							pos && $.tooltip("pos", $tooltip, { left: pos.left, top: pos.top });
						}
					});
				});
		},
		/**
		 * 性能数据获取后的通知接口
		 */
		data: function(options) {
			if (options) {
				if (options.kpi != null) {
					status.kpi = options.kpi;
				}
				if (options.event != null) {
					status.event = options.event;
				}
				if (options.avail != null) {
					status.avail = options.avai;
				}
			}
			var _this = this,
				$this = $(_this),
				timerName = "notice-delay-timer",
				timer = $this.data(timerName);
			if (timer) {
				clearTimeout(timer);
				$this.removeData(timerName);
			}
			$this.data(timerName, setTimeout(function() {
				$this.removeData(timerName);
				_this.isOpen() && _this.show();
			}, 1000));
		},
		/** 
		 * 选中图形后hang提层
		 */
		selectElementEvents : function() {
			var $topo = $.topology,
				$selector = $topo.selector;
			if ($selector.size() === 0) return;
			if ($selector.size() === 1 && $topo.isView($selector.selected().focus)) return;

			var selected = $selector.selected(),
				type, i, $tooltip;
			for (type in selected) {
				if (type === "focus") continue;
				for (i = 0, len = selected[type].length; i < len; i++) {
					obj = $topo.find(selected[type][i], type.substr(0, type.length - 1));
					$tooltip = tooltips[obj && obj.id];
					if ($tooltip) {
						$tooltip.trigger("click");
					}
				}
			}
		},
		/**
		 * 显示挂载控件
		 * 
		 * @param type 1:节点；2:连线
		 */
		show: function(type) {
			var _this = this;
			if (_this.number() <= 0) return;

			var lineType = [ "lines", "lineseters" ],
				symbolType = [ "symbols", "containers" ],
				allType = lineType.concat(symbolType),
				types = type == 1 ? symbolType : (type == 2 ? lineType : allType);
			$.each(types, function(i, type) {
				var map = $.topology.shapes[type];
				$.each(map, function(id, o) {
					var cfg = configs[o.getObjectClass()];
					if (!cfg) return;

					var tid = _this._getHangId(id);
					if (!$.tooltip("existed", tid)) {
						var $tooltip = _this.get(o, cfg);
						if (_this.isOpen(_this.type(o)) && o.visible) {
							if (!$.topology.isContainer(o) && !$.topology.isLineseter(o) || !o.isExpand) {
								_this._showTooltip(id, $tooltip, $tooltip.data("nodata"));
							}
						}
					}
					_this.reload(o.id);
				});
			});
		},
		/**
		 * 隐藏挂载控件
		 * 
		 * @param type 1:节点；2:连线
		 */
		hide: function(type) {
			var _this = this;
			$.each(tooltips, function(id, $tooltip) {
				var tmp = _this.type(id);
				if (type == 1 || type == 2) {
					tmp == type && $.tooltip("hide", $tooltip);
				} else {
					$.tooltip("hide", $tooltip);
				}
			});
		},
		reset: function() {
			var _this = this,
				id = null,
				hid = null;
				configs = null;
			for (id in tooltips) {
				hid = _this._getHangId(id);
				if ($.tooltip("existed", hid)) {
					$.tooltip("destroy", hid);
				}
			}
			tooltips = {};
			maxZIndex = 0;
			status = { kpi: null, event: null, avail: null };
			number = null;
			viewCenterCoords = null;
			isNodeHang = $.topology.view.option["node-hang-display"] == 1;
			isLineHang = $.topology.view.option["line-hang-display"] == 1;
			isShowLabel = $.topology.view.option["hang-name-display"] == 1;
			isNodeAdapter = $.topology.view.option["node-hang-adapter"] == 1;
			if (isNodeAdapter) {
				nodeHangPos = 1;
			} else {
				nodeHangPos = $.topology.view.option["node-hang-position"] || 1;
			}
		},
		/**
		 * 获取Tooltip
		 */
		get: function(o, cfg) {
			var _this = this;
			o = _this._getObjectById(o);
			var id = o.id,
				$tooltip = tooltips[id];
			cfg = cfg || configs[_this._getClass(o)];
			if (!o) {
				return null;
			}
			if (!cfg) {
				return null;
			}
			if (!$tooltip) {
				var $hang = $("#hangContainer");
				if (!$hang.length) {//使hang在鹰眼层级之下
					$("<div/>").attr("id", "hangContainer").insertAfter("#svgContainer");
				}
				$tooltip = $.tooltip({
					id : _this._getHangId(id),
					content: "<div class='nowrap'>数据加载中...</div>",
					skin: "minihang",
					parent: "#hangContainer",
					showAnimateDelay: 0,
					hideAnimateDelay: 0,
					hideAnimateTime: 0,
					offsetLeft: function() {
						if ($.topology.isLine(o) || $.topology.isLineseter(o)) {
							return 0;
						} else {
							var bbox = o.getIconBBox();
							return bbox.maxX - bbox.minX + 2;
						}
					},
					offsetRight: 2,
					offsetTop: function() {
						if ($.topology.isLine(o) || $.topology.isLineseter(o)) {
							return 0;
						} else {
							var bbox = o.getIconBBox();
							return bbox.minY - bbox.maxY;
						}
					},
					offsetBottom: -2,
					posLeft: function() {
						var bbox = $.topology.view.getViewBox(),
							pos = $.topology.graphEngine.coordsConvert({
								coords : { x: bbox.x, y: bbox.y },
								from : 'view',
								to : 'svg'
							});
						return pos.x;
					},
					posTop: function() {
						var bbox = $.topology.view.getViewBox(),
							pos = $.topology.graphEngine.coordsConvert({
								coords : { x: bbox.x, y: bbox.y },
								from : 'view',
								to : 'svg'
							});
						return pos.y;
					},
					posWidth: function() {
						var bbox = $.topology.view.getViewBox(),
							pos1 = $.topology.graphEngine.coordsConvert({
								coords : { x: bbox.x, y: bbox.y },
								from : 'view',
								to : 'svg'
							}),
							pos2 = $.topology.graphEngine.coordsConvert({
								coords : { x: bbox.width + bbox.x, y: bbox.height + bbox.y },
								from : 'view',
								to : 'svg'
							});
						return pos2.x - pos1.x;
					},
					posHeight: function() {
						var bbox = $.topology.view.getViewBox(),
							pos1 = $.topology.graphEngine.coordsConvert({
								coords : { x: bbox.x, y: bbox.y },
								from : 'view',
								to : 'svg'
							}),
							pos2 = $.topology.graphEngine.coordsConvert({
								coords : { x: bbox.width + bbox.x, y: bbox.height + bbox.y },
								from : 'view',
								to : 'svg'
							});
						return pos2.y - pos1.y;
					},
					isMonitorSize: true,
					adjustMethodByMonitor: "pos",
					monitorSizeTime: 2000
				});
				$tooltip.click(function() {//点击置顶
					$(this).css("z-index", ++maxZIndex);
				});
				tooltips[id] = $tooltip;
			}
			return $tooltip;
		},
		/**
		 * 重新加载数据
		 */
		reload: function(o, callback) {
			var _this = this;
			o = _this._getObjectById(o);
			if (!o) {
				return;
			}

			var id = o.id,
				tid = _this._getHangId(id),
				$tooltip = tooltips[id];
			if (o.kpis) {
				var objcls = o.getObjectClass(),
					cfg = configs[objcls],
					$table = $.tooltip("getContent", tid, ".tiptable"),
					kpiNames = cfg.hang.kpis.split(","),
					cvrNames = cfg.hang.converters.split(","),
					kpiName, cvrName, cvrCfg, val, cvr, parent, i,
					kpiZh, kpiUnit, nodata, tmpArr, reload, rowIndex = 0,
					noDataKpis = [];
				if (!$table || $table.length === 0) {
					$table = $("<table/>").addClass("tiptable");
					$.tooltip("clear", tid);
					$.tooltip("addContent", tid, $table);
				}
				for (i = 0, nodata = true; i < kpiNames.length; i++) {
					reload = true;
					kpiName = kpiNames[i];
					val = o.kpis[kpiName];
					if (val == null || val === "") {//无数据
						noDataKpis.push(kpiName);
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
					kpiZh = cfg.kpi[kpiName].zhname;
					kpiUnit = cfg.kpi[kpiName].unit || "";
					nodata = false;
					if (!parent) {
						reload = false;
						parent = _this._createDataRow(kpiName, cvrName, kpiZh, $table, rowIndex);
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
					_this._noDataProcess(id, $tooltip);
				} else {
					_this._hasDataProcess(id, o, $tooltip);
				}
			} else {
				_this._noDataProcess(id, $tooltip);
			}
			$.isFunction(callback) && callback.call(_this, null);
		},
		/**
		 * 获取tooltip位置
		 */
		_position: function(o) {
			var _this = this;
			o = _this._getObjectById(o);
			if (!o) {
				return null;
			}
			if ($.topology.isLine(o) || $.topology.isLineseter(o)) {
				return this._getLinePosition(o);
			} else {
				return this._getSymbolPosition(o);
			}
		},
		/**
		 * 获取连线坐标
		 */
		_getLinePosition: function(o, size) {
			var _this = this;
			o = _this._getObjectById(o);
			var nodeALinesCount = o.srcNode.getLines().length,//源点NodeA的连线数量
				nodeBLinesCount = o.dstNode.getLines().length,//终点NodeB的连线数量
				rectWidth = size ? size.width : tooltips[o.id].outerWidth(),//信息框宽度
				rectHeight = size ? size.height : tooltips[o.id].outerHeight(),//信息框高度
				pos = null;
			//当nodeALinesCount == nodeBLinesCount，
			//即连接nodeA的连线数量与连接nodeB的连线数量相同时,信息框在连线中心
			if (nodeALinesCount == nodeBLinesCount) {
				pos = o.getPointAtLength(o.getTotalLength() / 2);
			} else {
				if (nodeALinesCount > nodeBLinesCount) {//将信息框放在靠近NodeB的一端
					pos = o.getPointAtLength(o.getTotalLength() * 2 / 3);
				} else {//将信息框放在靠近NodeA的一端
					pos = o.getPointAtLength(o.getTotalLength() / 3);
				}
			}
			pos = $.topology.graphEngine.coordsConvert({
				coords : {x: pos.x, y: pos.y},
				from : 'view',
				to : 'svg'
			});
			return { left: parseInt(pos.x - rectWidth / 2, 10),
				top: parseInt(pos.y - rectHeight / 2, 10) };
		},
		/**
		 * 获取节点坐标
		 */
		_getSymbolPosition: function(o, size) {
			var _this = this;
			o = _this._getObjectById(o);
			if (isNodeAdapter) {//开花式布局
				var cc = _this._getViewCenterCoords(),
					cx = cc.viewX,//视图中心点x坐标
					cy = cc.viewY,//视图中心点y坐标
					nbox = o.getIconBBox(),
					nx = (nbox.minX + nbox.maxX) / 2,//节点中心点x坐标
					ny = (nbox.minY + nbox.maxY) / 2,//节点中心点y坐标
					r = Math.sqrt(Math.pow(ny - cy, 2) + Math.pow(nx - cx, 2)),//视图中心到节点中心的距离
					sinA = (ny - cy) / r,//节点中心与视图中心连线与X轴夹角的正弦值
					cosA = (nx - cx) / r,//节点中心与视图中心连线与X轴夹角的余弦值
					nw = nbox.maxX - nbox.minX,//节点宽度
					nh = nbox.maxY - nbox.minY,//节点高度
					nd = Math.sqrt(Math.pow(nw, 2) + Math.pow(nh, 2)),//节点对角线长度
					sinB = nh / nd,//节点正弦值
					r1 = r + (Math.abs(sinA) > sinB ? nh / 2 / Math.abs(sinA) : nw / 2 / Math.abs(cosA)),
					nfock = $.topology.graphEngine.coordsConvert({
						coords : { x: cx + r1 * cosA, y: cy + r1 * sinA },
						from : 'view',
						to : 'svg'
					}),
					r_ = Math.sqrt(Math.pow(nfock.y - cc.y, 2) + Math.pow(nfock.x - cc.x, 2)),
					sinA_ = (nfock.y - cc.y) / r_,//转换为dom坐标后的sinA值(有可能视图宽高比随屏幕适应导致sinA_与sinA不一致)
					cosA_ = (nfock.x - cc.x) / r_,
					r2 = Math.sqrt(Math.pow(nfock.y - cc.y, 2) + Math.pow(nfock.x - cc.x, 2)),
					$tooltip = tooltips[o.id],
					tw = $tooltip.outerWidth(),//hang宽度
					th = $tooltip.outerHeight(),//hang高度
					td = Math.sqrt(Math.pow(tw, 2) + Math.pow(th, 2)),//hang对角线长度
					sinC = th / td,//hang正弦值
					r3 = r2 + (Math.abs(sinA_) > sinC ? th / 2 / Math.abs(sinA_) : tw / 2 / Math.abs(cosA_));//视图中心点到hang卡片中心点的半径
				return { left: parseInt(cc.x + r3 * cosA_ - tw / 2), top: parseInt(cc.y + r3 * sinA_ - th / 2) };
			} else {//放在节点右侧
				var rectHeight = size ? size.height : tooltips[o.id].outerHeight(),
					rectWidth = size ? size.width : tooltips[o.id].outerWidth(),
					space = 3,
					bbox = o.getIconBBox(),
					coords = null;
				switch(parseInt(nodeHangPos)) {
				case 1:
					coords = $.topology.graphEngine.coordsConvert({
						coords : { x: bbox.maxX, y: (bbox.minY + bbox.maxY) / 2 },
						from : 'view',
						to : 'svg'
					});
					return { left: parseInt(coords.x) + space, top: parseInt(coords.y - rectHeight / 2, 10) };
				case 2:
					coords = $.topology.graphEngine.coordsConvert({
						coords : { x: (bbox.minX + bbox.maxX) / 2, y: bbox.maxY },
						from : 'view',
						to : 'svg'
					});
					return { left: parseInt(coords.x - rectWidth / 2), top: parseInt(coords.y) + space };
				case 3:
					coords = $.topology.graphEngine.coordsConvert({
						coords : { x: bbox.minX, y: (bbox.minY + bbox.maxY) / 2 },
						from : 'view',
						to : 'svg'
					});
					return { left: parseInt(coords.x) - rectWidth - space, top: parseInt(coords.y - rectHeight / 2, 10) };
				case 4:
					coords = $.topology.graphEngine.coordsConvert({
						coords : { x: (bbox.minX + bbox.maxX) / 2, y: bbox.minY },
						from : 'view',
						to : 'svg'
					});
					return { left: parseInt(coords.x - rectWidth / 2), top: parseInt(coords.y) - rectHeight - space };
				}
			}
		},
		/**
		 * 获取视图中心点位置并缓存
		 */
		_getViewCenterCoords: function() {
			if (!viewCenterCoords) {
				viewCenterCoords = this._countViewCenterCoords();
			}
			return viewCenterCoords;
		},
		/**
		 * 计算视图中心点位置并缓存
		 */
		_countViewCenterCoords: function() {
			if (!$.topology.view) {
				return null;
			}
			var vbox = $.topology.view.getViewBox(),
				cx = (vbox.x + vbox.x + vbox.width) / 2,//视图中心点x坐标
				cy = (vbox.y + vbox.y + vbox.height) / 2;//视图中心点y坐标
			viewCenterCoords = $.topology.graphEngine.coordsConvert({
				coords : { x: cx, y: cy },
				from : 'view',
				to : 'svg'
			});
			viewCenterCoords.viewX = cx;
			viewCenterCoords.viewY = cy;
			return viewCenterCoords;
		},
		/**
		 * 显示tooltip
		 * 
		 * @param id 网元id
		 * @param $tooltip Hang对象，可略
		 * @param $tooltip hiddenForce 强制隐藏，不做显示动作
		 */
		_showTooltip: function(id, $tooltip, hiddenForce) {
			var pos = this._position(id);
			$tooltip = $tooltip || tooltips[id];
			if (pos && $tooltip) {
				$.tooltip("pos", $tooltip, { left: pos.left, top: pos.top });
				if (!hiddenForce && $tooltip.is(":hidden")) {
					 $.tooltip("show", $tooltip, { left: pos.left, top: pos.top });
				}
			}
		},
		/**
		 * 无数据处理
		 */
		_noDataProcess: function(id, $tooltip) {
			var _this = this,
				timerName = "nodata-delay-timer",
				timer = $tooltip.data(timerName),
				tid = _this._getHangId(id);
			_this._changeTooltipContent(tid, "<div class='nowrap'>暂无数据.</div>");
			if (timer) {
				clearTimeout(timer);
				$tooltip.removeData(timerName);
			}
			$tooltip.data("nodata", true)
				.data(timerName, setTimeout(function() {
					$tooltip.removeData(timerName);
					$.tooltip("hide", $tooltip);
				}, 8000));
			_this._showTooltip(id, $tooltip, true);
		},
		/**
		 * 存在数据的处理
		 */
		_hasDataProcess: function(id, o, $tooltip) {
			var _this = this,
				queueName = "nodatahide";
			$tooltip.data("nodata", false).clearQueue(queueName);
			if (_this.isOpen(_this.type(o)) && o.visible) {
				if (!$.topology.isContainer(o) && !$.topology.isLineseter(o) || !o.isExpand) {
					_this._showTooltip(id, $tooltip);
				}
			}
		},
		/**
		 * 通过模型ID获取tooltip ID
		 */
		_getHangId: function(id) {
			return "hang_" + ($.type(id) === "object" ? id.id : id);
		},
		/**
		 * 改变tooltip的内容
		 */
		_changeTooltipContent: function(id, msg) {
			if ($.tooltip("existed", id)) {
				$.tooltip("clear", id);
				if (msg) {
					$.tooltip("addContent", id, msg);
				}
			}
		},
		/**
		 * 创建指标的DOM容器
		 * 
		 * @param kpiName kpi名称（ID）
		 * @param cvrName 转换器名称
		 * @param kpiZh kpi中文名称
		 * @param $table dom元素
		 * @param index 索引位置
		 * @returns
		 */
		_createDataRow: function(kpiName, cvrName, kpiZh, $table, index) {
			var _this = this,
				detailClass = "detail",
				arr = [],
				$tr = null,
				$div = null,
				style = _this._bigWidgetStyle(cvrName),
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
				$("<div class='nowrap'/>").append(kpiZh).appendTo(
						$("<td/>").addClass("tiptdleft2" + (isShowLabel ? "" : " hide")).attr("colspan", 2).appendTo($tr));
				insert($tr);
				arr.push($tr);

				$tr = $("<tr/>").addClass("tiptr");
				$div = $("<div class='nowrap'/>").addClass(detailClass).css(style).appendTo(
						$("<td/>").addClass("tiptdright2").attr("colspan", 2).appendTo($tr));
				insert($tr);
				arr.push($tr);
			} else {
				var $tr = $("<tr/>").addClass("tiptr").appendTo($table);
				$("<div class='nowrap'/>").append(kpiZh).appendTo($("<td/>")
					.addClass("tiptdleft" + (isShowLabel ? "" : " hide")).appendTo($tr));
				$div = $("<div class='nowrap'/>").addClass(detailClass).appendTo($("<td/>")
						.addClass("tiptdright").appendTo($tr));
				insert($tr);
				arr.push($tr);
			}
			$table.data(kpiName + "-rows", arr);
			return $div;
		},
		/**
		 * 获取模型
		 */
		_getObjectById: function(id) {
			if (!id) {
				return id;
			}
			if ($.type(id) !== "object") {
				return $.topology.find(id);
			}
			return id;
		},
		/**
		 * 获取模型object_class
		 */
		_getClass: function(o) {
			var _this = this;
			o = _this._getObjectById(o);
			if (!o) {
				return null;
			}
			return o.getObjectClass();
		},
		/**
		 * 特殊控件样式
		 */
		_bigWidgetStyle: function(name) {
			return {
				"PERCENT2GAUGE": {
					width: "100px",
					padding: "2px 15px"
				},
				"REVERSE_PERCENT2GAUGE": {
					width: "100px",
					padding: "5px 10px"
				},
				"TEMPERATURE": {
					width: "60px",
					padding: "2px 15px"
				}
			}[name];
		}
	};

})(jQuery);