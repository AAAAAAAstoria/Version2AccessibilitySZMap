/* ============================================================
   深圳城市无障碍地图 · 应用逻辑
   腾讯地图 GL JS · GCJ-02 坐标系
   ============================================================ */
(function () {
  'use strict';

  var CATEGORY_COLORS = { '医院': '#e2554d', '大学': '#2f80ed', '酒店': '#9333ea', '商场': '#ea8a0c', '公园': '#16a34a', '博物馆': '#0891b2', '图书馆': '#b45309' };
  var CATEGORY_STYLE = { '医院': 'hospital', '大学': 'university', '酒店': 'hotel', '商场': 'mall', '公园': 'park', '博物馆': 'museum', '图书馆': 'library' };
  var REVIEW_TAG_CLASS = { '优势亮点': 'good', '需要改善': 'bad', '其他建议': 'idea' };
  var TIERS = ['优秀', '良好', '一般', '待改善'];
  var TIER_COLORS = { '优秀': '#059669', '良好': '#65a30d', '一般': '#d97706', '待改善': '#dc2626' };
  var TIER_DESC = {
    '优秀': '无障碍设施与服务整体完善，可独立、顺畅使用',
    '良好': '主要环节无障碍较完善，个别细节仍可提升',
    '一般': '具备基础无障碍条件，部分环节存在明显短板',
    '待改善': '无障碍建设缺口较多，通行与服务存在障碍'
  };

  var map = null;
  var markerLayer = null;
  var infoWindow = null;
  var filters = { category: '全部', tier: '全部', photo: '全部' };

  /* ---------------- SVG 图钉 ---------------- */
  function pinSvg(color, kind) {
    var white = '<circle cx="17" cy="15.5" r="8.6" fill="#ffffff"/>';
    var glyph;
    if (kind === 'hospital') {
      // 医疗十字
      glyph = '<path d="M15.2 10.6h3.6v3.2h3.2v3.6h-3.2v3.2h-3.6v-3.2h-3.2v-3.6h3.2z" fill="' + color + '"/>';
    } else if (kind === 'university') {
      // 学士帽
      glyph =
        '<path d="M17 10l7.4 3.4L17 16.8l-7.4-3.4z" fill="' + color + '"/>' +
        '<path d="M13.1 15.7v3c0 1.3 1.75 2.3 3.9 2.3s3.9-1 3.9-2.3v-3L17 17.5z" fill="' + color + '"/>';
    } else if (kind === 'hotel') {
      // 酒店楼宇(带窗格与门)
      glyph =
        '<path fill-rule="evenodd" fill="' + color + '" d="M12.1 9.6h9.8v11.3h-9.8z' +
        'M13.9 11.2h1.5v1.5h-1.5zM15.8 11.2h1.5v1.5h-1.5zM17.7 11.2h1.5v1.5h-1.5z' +
        'M13.9 13.3h1.5v1.5h-1.5zM15.8 13.3h1.5v1.5h-1.5zM17.7 13.3h1.5v1.5h-1.5z' +
        'M16.1 17.4h1.9v3.5h-1.9z"/>';
    } else if (kind === 'mall') {
      // 购物袋
      glyph =
        '<path fill="' + color + '" d="M13 13.4h8l-.8 7.4h-6.4z"/>' +
        '<path fill="' + color + '" d="M14.7 13.4v-1.8a2.3 2.3 0 0 1 4.6 0v1.8h-1.4v-1.8a0.9 0.9 0 0 0-1.8 0v1.8z"/>';
    } else if (kind === 'museum') {
      // 博物馆·古典立柱建筑
      glyph =
        '<path fill="' + color + '" d="M13 13h8v7h-8z"/>' +
        '<path fill="' + color + '" d="M13 11h8v2h-8zM14.5 8h5v3h-5z"/>' +
        '<path fill="' + color + '" d="M12.5 20h2.5v-3h-2.5zM19 20h2.5v-3H19zM15.5 18h3v-2h-3z"/>';
    } else if (kind === 'library') {
      // 图书馆·书本
      glyph =
        '<path fill="' + color + '" d="M10 13.5l7-1 0.2 1.6-7 1zM9.8 15.5l7.2-1 0.2 1.6-7.2 1z"/>' +
        '<path fill="' + color + '" d="M17 7.5v11h-7v-11zM13 10v-1h2v1zM13 12v-1h2v1z"/>';
    } else {
      // 公园·松树
      glyph =
        '<path fill="' + color + '" d="M17 9.1l4 5.9h-2.3l2.9 3.7h-9.2l2.9-3.7h-2.3z"/>' +
        '<path fill="' + color + '" d="M16.2 18.7h1.6v2.4h-1.6z"/>';
    }
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">' +
      '<path d="M17 1C8.2 1 1 8.2 1 17c0 11.6 14.2 24.6 15.3 25.5a1.2 1.2 0 0 0 1.4 0C18.8 41.6 33 28.6 33 17 33 8.2 25.8 1 17 1z" fill="' + color + '" stroke="#ffffff" stroke-width="1.6"/>' +
      white + glyph + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function filteredLocations() {
    return window.LOCATIONS.filter(function (loc) {
      if (filters.category !== '全部' && loc.category !== filters.category) return false;
      if (filters.tier !== '全部' && loc.tier !== filters.tier) return false;
      if (filters.photo === '有照片' && !loc.has_photos) return false;
      if (filters.photo === '无照片' && loc.has_photos) return false;
      return true;
    });
  }

  function buildGeometries() {
    return filteredLocations().map(function (loc) {
      return {
        id: loc.id,
        styleId: CATEGORY_STYLE[loc.category] || 'hospital',
        position: new TMap.LatLng(loc.lat, loc.lng),
        properties: { name: loc.name }
      };
    });
  }

  function refreshMarkers() {
    if (!markerLayer) return;
    markerLayer.setGeometries(buildGeometries());
    var n = filteredLocations().length;
    var el = document.getElementById('filter-count-num');
    if (el) el.textContent = n;
  }

  /* ---------------- 弹窗内容 ---------------- */
  function reviewBlock(label, text, tagClass) {
    if (!text) return '';
    var needCut = text.length > 150;
    var short = needCut ? text.slice(0, 150) : text;
    var h = '<div class="review-block">';
    h += '<span class="review-tag ' + tagClass + '">' + esc(label) + '</span>';
    if (needCut) {
      h += '<div class="review-text"><span class="rv-short">' + esc(short) + '……</span>' +
           '<span class="rv-full" style="display:none">' + esc(text) + '</span></div>' +
           '<button class="review-toggle" data-act="expand">展开全文 ▾</button>';
    } else {
      h += '<div class="review-text">' + esc(text) + '</div>';
    }
    return h + '</div>';
  }

  function popupHtml(loc) {
    var color = CATEGORY_COLORS[loc.category];
    var tColor = TIER_COLORS[loc.tier];
    var h = '<div class="iw">';
    h += '<button class="iw-close" data-act="close" aria-label="关闭">✕</button>';

    // 头部
    h += '<div class="iw-head">';
    h += '<div class="iw-badges">' +
         '<span class="badge" style="background:' + color + '">' + esc(loc.category) + '</span>' +
         '<span class="badge tier" style="color:' + tColor + ';border-color:' + tColor + '">' + esc(loc.tier) + '</span></div>';
    h += '<div class="iw-name">' + esc(loc.name) + '</div>';
    h += '<div class="iw-addr"><svg width="11" height="13" viewBox="0 0 11 13"><path d="M5.5 0C2.5 0 0 2.4 0 5.4 0 9.4 5.5 13 5.5 13S11 9.4 11 5.4C11 2.4 8.5 0 5.5 0zm0 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#8a94a6"/></svg><span>' + esc(loc.address) + '</span></div>';

    // 评分
    var deg = Math.round(loc.score / 100 * 360);
    h += '<div class="score-row">';
    h += '<div class="score-ring" style="background:conic-gradient(' + tColor + ' ' + deg + 'deg, #e8ecf1 ' + deg + 'deg)">' +
         '<div class="score-num" style="color:' + tColor + '">' + loc.score + '<small>无障碍表现</small></div></div>';
    h += '<div class="score-desc"><div class="t" style="color:' + tColor + '">' + esc(loc.tier) + ' · ' + loc.score + ' 分</div>' +
         '<div class="d">' + esc(TIER_DESC[loc.tier]) + '</div>' +
         '<div class="d">测评日期:' + esc(loc.date || '—') + ' · 评分由系统依据测评记录自动生成</div></div>';
    h += '</div></div>'; // score-row, iw-head

    h += '<div class="iw-body">';

    // 无障碍情况
    h += '<div class="iw-sec-title">无障碍情况</div>';
    loc.sections.forEach(function (sec) {
      h += '<div class="iw-group"><div class="iw-group-name">' + esc(sec.title) + '</div>';
      sec.items.forEach(function (it) {
        h += '<div class="iw-field"><span class="k">' + esc(it.label) + '</span><span class="v">' + esc(it.value) + '</span></div>';
      });
      h += '</div>';
    });

    // 相关照片
    h += '<div class="iw-sec-title">相关照片</div>';
    if (loc.photos.length) {
      h += '<div class="photo-grid">';
      loc.photos.forEach(function (u) {
        h += '<a href="' + esc(u) + '" target="_blank" rel="noopener" title="点击查看原图">' +
             '<img src="' + esc(u) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.style.display=\'none\'" alt="现场照片"></a>';
      });
      h += '</div>';
    } else {
      h += '<div class="photo-empty">该点位暂无可展示的照片:原测评表中的照片为本地文件,未生成可访问的链接,已按规则弃用。</div>';
    }

    // 真实评价
    h += '<div class="iw-sec-title">真实评价与文字说明</div>';
    Object.keys(loc.review).forEach(function (key) {
      if (!loc.review[key]) return;
      h += reviewBlock(key, loc.review[key], REVIEW_TAG_CLASS[key] || 'summary');
    });

    h += '</div></div>'; // iw-body, iw
    return h;
  }

  function openPopup(loc) {
    var pos = new TMap.LatLng(loc.lat, loc.lng);
    var html = popupHtml(loc);
    if (!infoWindow) {
      // 惰性创建:构造时即传入 position 与 content,避免 SDK 解析空参数
      infoWindow = new TMap.InfoWindow({
        map: map,
        position: pos,
        content: html,
        enableCustom: true,
        offset: { x: 0, y: -42 }
      });
    } else {
      infoWindow.setPosition(pos);
      infoWindow.setContent(html);
    }
    infoWindow.open();
  }

  function focusLocation(loc, zoom) {
    // 让图钉落在视口约 62% 高度处,为上方弹窗留出空间
    var needZoom = zoom && map.getZoom() < zoom;
    var targetZoom = needZoom ? zoom : map.getZoom();
    var containerH = document.getElementById('map-container').clientHeight || window.innerHeight;
    var dpp = 360 / (256 * Math.pow(2, targetZoom)); // 每像素纬度数(Web Mercator 近似)
    var target = new TMap.LatLng(loc.lat + containerH * 0.24 * dpp, loc.lng);
    if (needZoom) map.setZoom(zoom); // 先缩放(缩放不打断其后的平移)
    map.panTo(target);               // 再平移,最终中心必为目标点
    openPopup(loc);
  }

  /* ---------------- 地图初始化 ---------------- */
  window.initAccessibilityMap = function () {
    map = new TMap.Map('map-container', {
      center: new TMap.LatLng(22.5850, 114.0050),
      zoom: 11,
      pitch: 0,
      rotation: 0
    });

    var markerStyles = {};
    Object.keys(CATEGORY_STYLE).forEach(function (cat) {
      var key = CATEGORY_STYLE[cat];
      markerStyles[key] = new TMap.MarkerStyle({
        width: 34, height: 44, anchor: { x: 17, y: 44 },
        src: pinSvg(CATEGORY_COLORS[cat], key)
      });
    });

    markerLayer = new TMap.MultiMarker({
      map: map,
      styles: markerStyles,
      geometries: buildGeometries()
    });

    infoWindow = null; // 首次点击图钉时惰性创建

    markerLayer.on('click', function (evt) {
      var geo = evt.geometry;
      if (!geo) return;
      var loc = window.LOCATIONS.find(function (l) { return l.id === geo.id; });
      if (loc) focusLocation(loc); // 保持当前缩放,平移让出弹窗空间
    });

    // 视野适配全部点位
    try {
      var bounds = new TMap.LatLngBounds();
      window.LOCATIONS.forEach(function (loc) { bounds.extend(new TMap.LatLng(loc.lat, loc.lng)); });
      map.fitBounds(bounds, { padding: 90 });
    } catch (e) { /* 保持默认中心即可 */ }

    initUiEvents();
    updateFilterCount();

    // 公开编程接口(便于调试与外部联动)
    window.AccessibilityMap = {
      map: map,
      focus: function (id) {
        var loc = window.LOCATIONS.find(function (l) { return l.id === id; });
        if (loc) focusLocation(loc, 15);
      },
      list: function () { return window.LOCATIONS.map(function (l) { return { id: l.id, name: l.name }; }); }
    };
  };

  /* ---------------- UI 事件 ---------------- */
  function updateFilterCount() {
    var el = document.getElementById('filter-count-num');
    if (el) el.textContent = filteredLocations().length;
  }

  function initUiEvents() {
    // 缩放按钮
    document.getElementById('zoom-in').addEventListener('click', function () {
      map.setZoom(Math.min(20, map.getZoom() + 1));
    });
    document.getElementById('zoom-out').addEventListener('click', function () {
      map.setZoom(Math.max(3, map.getZoom() - 1));
    });

    // 筛选 chips
    document.querySelectorAll('.chips').forEach(function (group) {
      group.addEventListener('click', function (e) {
        var btn = e.target.closest('.chip');
        if (!btn) return;
        group.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        filters[group.dataset.filter] = btn.dataset.value;
        refreshMarkers();
      });
    });

    // 搜索
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var clearBtn = document.getElementById('search-clear');

    function renderResults() {
      var q = input.value.trim();
      clearBtn.style.display = q ? 'block' : 'none';
      if (!q) { results.classList.remove('show'); results.innerHTML = ''; return; }
      var matched = window.LOCATIONS.filter(function (l) {
        return l.name.indexOf(q) > -1 || l.address.indexOf(q) > -1;
      }).slice(0, 8);
      if (!matched.length) {
        results.innerHTML = '<div class="sr-empty">未找到「' + esc(q) + '」相关地点</div>';
      } else {
        results.innerHTML = matched.map(function (l) {
          return '<div class="sr-item" data-id="' + l.id + '">' +
                 '<span class="pin-dot" style="background:' + CATEGORY_COLORS[l.category] + '"></span>' +
                 '<span><div class="sr-name">' + esc(l.name) + '</div>' +
                 '<div class="sr-meta">' + esc(l.category) + ' · ' + esc(l.tier) + ' ' + l.score + '分</div></span></div>';
        }).join('');
      }
      results.classList.add('show');
    }

    input.addEventListener('input', renderResults);
    input.addEventListener('focus', renderResults);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = results.querySelector('.sr-item');
        if (first) { selectResult(first.dataset.id); }
      }
    });
    results.addEventListener('click', function (e) {
      var item = e.target.closest('.sr-item');
      if (item) selectResult(item.dataset.id);
    });
    clearBtn.addEventListener('click', function () {
      input.value = '';
      renderResults();
      input.focus();
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-card')) results.classList.remove('show');
    });

        function selectResult(id) {
      var loc = window.LOCATIONS.find(function (l) { return l.id === id; });
      if (!loc) return;
      results.classList.remove('show');
      input.value = loc.name;
      clearBtn.style.display = 'block';
      focusLocation(loc, 15);
    }
    // 修复移动端滑动逻辑
    document.addEventListener('touchstart', function(e) {
      var iwBody = e.target.closest('.iw-body');
      if (iwBody) e.stopPropagation(); 
    }, { passive: true });

    // 统一处理弹窗点击(关闭与展开)
    document.addEventListener('click', function (e) {
      var actBtn = e.target.closest('[data-act]');
      if (!actBtn) return;
      var act = actBtn.dataset.act;
      if (act === 'close') {
        if (infoWindow) infoWindow.close();
      } else if (act === 'expand') {
        var block = actBtn.parentNode;
        block.querySelector('.rv-short').style.display = 'none';
        block.querySelector('.rv-full').style.display = '';
        actBtn.remove();
      }
    });
  }

})();
