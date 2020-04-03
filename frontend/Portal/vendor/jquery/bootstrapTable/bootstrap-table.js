/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * version: 1.2.4
 * https://github.com/wenzhixin/bootstrap-table/
 *
 * Modify By CaiHanchun  Add TreeTable
 *
 */

!function ($) {
    'use strict';

    // TOOLS DEFINITION
    // ======================
    // it only does '%s', and return '' when arguments are undefined
    var sprintf = function (str) {
        var args = arguments,
            flag = true,
            i = 1;

        str = str.replace(/%s/g, function () {
            var arg = args[i++];

            if (typeof arg === 'undefined') {
                flag = false;
                return '';
            }
            return arg;
        });
        if (flag) {
            return str;
        }
        return '';
    };

    var getPropertyFromOther = function (list, from, to, value) {
        var result = '';
        $.each(list, function (i, item) {
            if (item[from] === value) {
                result = item[to];
                return false;
            }
            return true;
        });
        return result;
    };

    var getFieldIndex = function (columns, field) {
        var index = -1;

        $.each(columns, function (i, column) {
            if (column.field === field) {
                index = i;
                return false;
            }
            return true;
        });
        return index;
    };

    var getScrollBarWidth = function () {
        var inner = $('<p/>').addClass('fixed-table-scroll-inner'),
            outer = $('<div/>').addClass('fixed-table-scroll-outer'),
            w1, w2;

        outer.append(inner);
        $('body').append(outer);

        w1 = inner[0].offsetWidth;
        outer.css('overflow', 'scroll');
        w2 = inner[0].offsetWidth;

        if (w1 == w2) {
            w2 = outer[0].clientWidth;
        }

        outer.remove();
        return w1 - w2;
    };

    var calculateFunctionValue = function (self, func, args, defaultValue) {
        if (typeof func === 'string') {
            // support obj.func1.func2
            var fs = func.split('.');

            if (fs.length > 1) {
                func = window;
                $.each(fs, function (i, f) {
                    func = func[f];
                });
            } else {
                func = window[func];
            }
        }
        if (typeof func === 'function') {
            return func.apply(self, args);
        }
        return defaultValue;
    };
    // console.log($.Lang("uidataTable.sNoResult"))
    var _bootstrap_table_GlobalString = { "bootstrap_table_NoResult": "没有找到任务" };
    // var _bootstrap_table_GlobalString = { "bootstrap_table_NoResult": $.Lang("uidataTable.sNoResult") };
    // BOOTSTRAP TABLE CLASS DEFINITION
    // ======================

    var BootstrapTable = function (el, options) {
        this.options = options;
        this.$el = $(el);
        this.$el_ = this.$el.clone();
        this.timeoutId_ = 0;

        this.init();
        if (options.bootstrap_table_NoResult) {
            _bootstrap_table_GlobalString.bootstrap_table_NoResult = options.bootstrap_table_NoResult;
        }
    };

    BootstrapTable.DEFAULTS = {
        classes: 'table table-hover',
        height: "500",
        undefinedText: '-',
        sortName: undefined,
        sortOrder: 'asc',
        striped: false,
        columns: [],
        data: [],
        method: 'get',
        url: undefined,
        cache: true,
        contentType: 'application/json',
        queryParams: function (params) { return params; },
        queryParamsType: 'limit', // undefined
        responseHandler: function (res) { return res; },
        pagination: false,
        sidePagination: 'client', // client or server
        totalRows: 0, // server side need to set
        pageNumber: 1,
        pageSize: 10,
        locale: "zh-CN",
        pageList: [10, 25, 50, 100],
        search: false,
        selectItemName: 'btSelectItem',
        showHeader: true,
        showColumns: false,
        showRefresh: false,
        showToggle: false,
        minimumCountColumns: 1,
        idField: undefined,
        cardView: false,
        clickToSelect: false,
        singleSelect: false,
        toolbar: undefined,
        checkboxHeader: true,
        sortable: true,
        maintainSelected: false,
        treegrid: false,
        searchFromServer : false,  // 服务端搜索 add by luwei
 		autoExpand : true, // 是否自动展开 add by luwei
        expandFirst : true, // 是否展开第一行 add by luwei
        rowChildrenUrl : "", // 展开时请求的url add by luwei
        rowChildrenParamColumn : [ // 展开时请求需要携带的参数列 add by luwei
        ],
        
        rowStyle: function (row, index) { return {}; },

        formatRecordsPerPage: function (pageNumber) {
            // return sprintf('%s records per page', pageNumber);
            return sprintf('每页显示 %s 条记录', pageNumber);
        },
        formatShowingRows: function (pageFrom, pageTo, totalRows) {
            return sprintf('显示第 %s 到第 %s 条记录，总共 %s 条记录', pageFrom, pageTo, totalRows);
        },
        onAll: function (name, args) { return false; },
        searchChanged: function (name, args) { return false; },
        onClickRow: function (item, $element) { return false; },
        onDblClickRow: function (item, $element) { return false; },
        onSort: function (name, order) { return false; },
        onCheck: function (row) { return false; },
        onUncheck: function (row) { return false; },
        onCheckAll: function () { return false; },
        onUncheckAll: function () { return false; },
        onLoadSuccess: function (data) { return false; },
        onLoadError: function (status) { return false; }
    };

    BootstrapTable.COLUMN_DEFAULTS = {
        radio: false,
        checkbox: false,
        checkboxEnabled: true,
        field: undefined,
        title: undefined,
        'class': undefined,
        align: undefined, // left, right, center
        halign: undefined, // left, right, center
        valign: undefined, // top, middle, bottom
        width: undefined,
        sortable: false,
        order: 'asc', // asc, desc
        visible: true,
        switchable: true,
        clickToSelect: true,
        formatter: undefined,
        events: undefined,
        sorter: undefined,
        cellStyle: undefined
    };

    BootstrapTable.EVENTS = {
        'all.bs.table': 'onAll',
        'searchChanged.bs.table': 'searchChanged',
        'click-row.bs.table': 'onClickRow',
        'dbl-click-row.bs.table': 'onDblClickRow',
        'sort.bs.table': 'onSort',
        'check.bs.table': 'onCheck',
        'uncheck.bs.table': 'onUncheck',
        'check-all.bs.table': 'onCheckAll',
        'uncheck-all.bs.table': 'onUncheckAll',
        'load-success.bs.table': 'onLoadSuccess',
        'load-error.bs.table': 'onLoadError'
    };

    BootstrapTable.prototype.init = function () {
        this.initContainer();
        this.initTable();
        this.initHeader();
        this.initData();
        this.initToolbar();
        this.initPagination();
        this.initBody();
        this.initServer();
    };

    BootstrapTable.prototype.initContainer = function () {
        var loadingText = this.options.loadingText || "加载中,请稍候...";
        this.$container = $([
            '<div class="bootstrap-table">',
                '<div class="fixed-table-toolbar"></div>',
                '<div class="fixed-table-container">',
                    '<div class="fixed-table-header"><table></table></div>',
                    '<div class="fixed-table-body">',
                        '<div class="fixed-table-loading bootstrap_table_Loading">',
                            ' <div class="loading-box"><i class="icon-loading"></i><p>'+loadingText+'</p></div>',
                        '</div>',
                    '</div>',
                    '<div class="fixed-table-pagination"></div>',
                '</div>',
            '</div>'].join(''));

        this.$container.insertAfter(this.$el);
        this.$container.find('.fixed-table-body').append(this.$el);
        this.$container.after('<div class="clearfix"></div>');
        this.$loading = this.$container.find('.fixed-table-loading');

        this.$el.addClass(this.options.classes);
        if (this.options.striped) {
            this.$el.addClass('table-striped');
        }
    };

    BootstrapTable.prototype.initTable = function () {
        var that = this,
            columns = [],
            data = [];

        this.$header = this.$el.find('thead');
        if (!this.$header.length) {
            this.$header = $('<thead></thead>').appendTo(this.$el);
        }
        if (!this.$header.find('tr').length) {
            this.$header.append('<tr></tr>');
        }
        this.$header.find('th').each(function () {
            var column = $.extend({}, {
                title: $(this).html(),
                'class': $(this).attr('class')
            }, $(this).data());

            columns.push(column);
        });
        this.options.columns = $.extend([], columns, this.options.columns);
        $.each(this.options.columns, function (i, column) {
            that.options.columns[i] = $.extend({}, BootstrapTable.COLUMN_DEFAULTS,
                { field: i }, column); // when field is undefined, use index instead
        });

        // if options.data is setting, do not process tbody data
        if (this.options.data.length) {
            return;
        }

        this.$el.find('tbody tr').each(function () {
            var row = {};
            $(this).find('td').each(function (i) {
                row[that.options.columns[i].field] = $(this).html();
            });
            data.push(row);
        });
        this.options.data = data;
    };

    BootstrapTable.prototype.initHeader = function () {
        var that = this,
            visibleColumns = [],
            html = [];

        this.header = {
            fields: [],
            styles: [],
            classes: [],
            formatters: [],
            events: [],
            sorters: [],
            cellStyles: [],
            clickToSelects: []
        };
        $.each(this.options.columns, function (i, column) {
            var text = '',
                style = sprintf('text-align: %s; ', column.align) +
                        sprintf('vertical-align: %s; ', column.valign),
                class_ = sprintf(' class="%s"', column['class']),
                order = that.options.sortOrder || column.order;

            if (!column.visible) {
                return;
            }

            visibleColumns.push(column);
            that.header.fields.push(column.field);
            that.header.styles.push(style);
            that.header.classes.push(class_);
            that.header.formatters.push(column.formatter);
            that.header.events.push(column.events);
            that.header.sorters.push(column.sorter);
            that.header.cellStyles.push(column.cellStyle);
            that.header.clickToSelects.push(column.clickToSelect);

            if (column.halign) {
                style = sprintf('text-align: %s; ', column.halign) +
                    sprintf('vertical-align: %s; ', column.valign);
            }
            style += sprintf('width: %spx; ', column.checkbox || column.radio ? 36 : column.width);

            html.push('<th',
                column.checkbox || column.radio ? ' class="bs-checkbox"' :
                class_,
                sprintf(' style="%s"', style),
                '>');
            html.push(sprintf('<div class="th-inner %s">', that.options.sortable && column.sortable ?
                'sortable' : ''));

            text = column.title;
            if (that.options.sortName === column.field && that.options.sortable && column.sortable) {
                text += that.getCaretHtml();
            }

            if (column.checkbox) {
                if (!that.options.singleSelect && that.options.checkboxHeader) {
                    text = '<input name="btSelectAll" type="checkbox" />';
                }
                that.header.stateField = column.field;
            }
            if (column.radio) {
                text = '';
                that.header.stateField = column.field;
                that.options.singleSelect = true;
            }

            html.push(text);
            html.push('</div>');
            html.push('<div class="fht-cell"></div>');
            html.push('</th>');
        });

        this.$header.find('tr').html(html.join(''));
        this.$header.find('th').each(function (i) {
            $(this).data(visibleColumns[i]);

            if (that.options.sortable && visibleColumns[i].sortable) {
                $(this).off('click').on('click', $.proxy(that.onSort, that));
            }
        });

        if (!this.options.showHeader || this.options.cardView) {
            this.$header.hide();
            this.$container.find('.fixed-table-header').hide();
            this.$loading.css('top', 0);
        } else {
            this.$header.show();
            this.$container.find('.fixed-table-header').show();
            this.$loading.css('top', '40px');
        }

        this.$selectAll = this.$header.find('[name="btSelectAll"]');
        this.$selectAll.off('click').on('click', function () {
            var checked = $(this).prop('checked');
            that[checked ? 'checkAll' : 'uncheckAll']();
        });
    };

    BootstrapTable.prototype.initData = function (data, append) {
        if (append) {
            this.data = this.data.concat(data);
        } else {
            this.data = data || this.options.data;
        }
        this.options.data = this.data;

        this.initSort();
    };

    BootstrapTable.prototype.initSort = function () {
        var that = this,
            name = this.options.sortName,
            order = this.options.sortOrder === 'desc' ? -1 : 1,
            index = $.inArray(this.options.sortName, this.header.fields);

        if (index !== -1) {
            this.data.sort(function (a, b) {
                var value = calculateFunctionValue(that.header, that.header.sorters[index], [a[name], b[name]]);

                if (value !== undefined) {
                    return order * value;
                }

                if (a[name] === b[name]) {
                    return 0;
                }
                if (a[name] < b[name]) {
                    return order * -1;
                }
                return order;
            });
        }
    };

    BootstrapTable.prototype.onSort = function (event) {
        var $this = $(event.currentTarget),
            $this_ = this.$header.find('th').eq($this.index());

        this.$header.add(this.$header_).find('span.order').remove();

        if (this.options.sortName === $this.data('field')) {
            this.options.sortOrder = this.options.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.options.sortName = $this.data('field');
            this.options.sortOrder = $this.data('order') === 'asc' ? 'desc' : 'asc';
        }
        this.trigger('sort', this.options.sortName, this.options.sortOrder);

        $this.add($this_).data('order', this.options.sortOrder)
            .find('.th-inner').append(this.getCaretHtml());

        if (this.options.sidePagination === 'server') {
            this.initServer();
            return;
        }
        this.initSort();
        this.initBody();
    };

    BootstrapTable.prototype.initToolbar = function () {
        var that = this,
            html = [],
            timeoutId = 0,
            $keepOpen,
            $search;

        this.$toolbar = this.$container.find('.fixed-table-toolbar').html('');

        if (typeof this.options.toolbar === 'string') {
            $('<div class="bars pull-left"></div>')
                .appendTo(this.$toolbar)
                .append($(this.options.toolbar));
        }

        // showColumns, showToggle, showRefresh
        html = ['<div class="columns btn-group pull-right">'];

        if (this.options.showRefresh) {
            html.push('<button class="btn btn-default" type="button" name="refresh">',
                '<i class="glyphicon glyphicon-refresh icon-refresh"></i>',
                '</button>');
        }

        if (this.options.showToggle) {
            html.push('<button class="btn btn-default" type="button" name="toggle">',
                '<i class="glyphicon glyphicon glyphicon-list-alt icon-list-alt"></i>',
                '</button>');
        }

        if (this.options.showColumns) {
            html.push(sprintf('<div class="keep-open %s">',
                this.options.showRefresh || this.options.showToggle ? 'btn-group' : ''),
                '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">',
                '<i class="glyphicon glyphicon-th icon-th"></i>',
                ' <span class="caret"></span>',
                '</button>',
                '<ul class="dropdown-menu" role="menu">');

            $.each(this.options.columns, function (i, column) {
                if (column.radio || column.checkbox) {
                    return;
                }
                var checked = column.visible ? ' checked="checked"' : '';

                if (column.switchable) {
                    html.push(sprintf('<li>' +
                        '<label><input type="checkbox" value="%s"%s> %s</label>' +
                        '</li>', i, checked, column.title));
                }
            });
            html.push('</ul>',
                '</div>');
        }

        html.push('</div>');

        if (html.length > 2) {
            this.$toolbar.append(html.join(''));
        }

        if (this.options.showRefresh) {
            this.$toolbar.find('button[name="refresh"]')
                .off('click').on('click', $.proxy(this.refresh, this));
        }

        if (this.options.showToggle) {
            this.$toolbar.find('button[name="toggle"]')
                .off('click').on('click', function () {
                    that.options.cardView = !that.options.cardView;
                    that.initHeader();
                    that.initBody();
                });
        }

        if (this.options.showColumns) {
            $keepOpen = this.$toolbar.find('.keep-open');
            $keepOpen.find('li').off('click').on('click', function (event) {
                event.stopImmediatePropagation();
            });
            $keepOpen.find('input').off('click').on('click', function () {
                var $this = $(this);

                that.toggleColumn($this.val(), $this.prop('checked'), false);
            });
        }

        if (this.options.search) {
            html = [];
            // html.push(
            //     '<div class="form-inline" style="float:right;">',
            //         '<div class="pull-right input-group search">',
            //             '<input class="input-sm form-control" style="width:200px" type="text" id="bootstrap_table_Search"  placeholder="' + this.options.search + '">',
            //             '<span class="input-group-btn">',
            //             '<button class="btn btn-sm btn-default" type="button" style="height:30px;"><i class="fa fa-search"></i></button>',
            //             '</span>',
            //         '</div>',
            //     '</div>'
            //     );
            html.push('<div class="w-icon password-input" style="float: right;"> <input type="text" class="icon-inline form-control" style="width:300px" id="bootstrap_table_Search"  autocomplete="off"  placeholder="' + this.options.search + '"> <i class="icon aufontAll h-icon-all-search-o search-btn" ></i> </div>')
            this.$toolbar.append(html.join(''));
            $search = this.$toolbar.find('.search-btn');
            $search.off('click.search').on('click.search', function (event) {
                that.onSearch(event);
            });
			
            //update by luwei : 客户端搜索才绑定改变事件
            if (!this.options.searchFromServer) {
            	var $searchChange = this.$toolbar.find('.search input');
	            $searchChange.off('keyup').on('keyup', function (event) {
	                clearTimeout(timeoutId); // doesn't matter if it's 0
	                timeoutId = setTimeout(function () {
	                    var text = $.trim($(event.currentTarget).val());
	                    if (text == "") {
	                        that.onSearch(event);
	                    }
	                }, 500);
	            })
            }
            

            //html = [];
            //html.push(
            //    '<div class="pull-right search">',
            //        '<input class="input-sm form-control" style="width:200px" type="text" id="bootstrap_table_Search"  placeholder="' + this.options.search + '">',
            //    '</div>'
            //    );
            //this.$toolbar.append(html.join(''));
            //$search = this.$toolbar.find('.search input');
            //$search.off('keyup').on('keyup', function (event) {
            //    clearTimeout(timeoutId); // doesn't matter if it's 0
            //    timeoutId = setTimeout(function () {
            //        that.onSearch(event);
            //    }, 500); // 500ms
            //});
        }
    };

    BootstrapTable.prototype.onSearch = function (event) {
        var text = $.trim($(event.currentTarget).val()) || $.trim($(event.currentTarget).parent().parent().find("input").val());
        if (text === this.searchText) {
            return;
        }
        this.searchText = text;

        this.options.pageNumber = 1;
        this.initSearch();
        this.updatePagination();
        this.options.searchChanged();
        
        //add by luwei 服务端搜索
        if(this.options.searchFromServer) {
        	var url = this.options.url;
        	this.refresh({url:url});
        }
        
    };

    BootstrapTable.prototype.initSearch = function () {
        var that = this;

        if (this.options.sidePagination !== 'server') {
            var data = new this.options.data.constructor();
            jQuery.extend(true, data, this.options.data);

            var s = this.searchText && this.searchText.toLowerCase();

            this.data = s ? $.grep(data, function (item) {
                return that.isMatch(item, s);
            }) : this.options.data;
        }
    };

    BootstrapTable.prototype.isMatch = function (item, sText) {
        var that = this,
            key;
        // 元素的DisplayName能匹配，显示该元素
        for (key in item) {
            if (key === this.header.fields[0] &&
                (item[key] + '').toLowerCase().indexOf(sText) !== -1) {
                return true;
            }
        }

        // 元素的children里有匹配项，显示该元素
        if (item.children && item.children.length > 0) {
            item.children = $.grep(item.children, function (citem) {
                // 递归匹配children元素
                return that.isMatch(citem, sText);
            });

            if (item.children != null && item.children.length > 0) {
                return true;
            }
        }

        // 匹配失败，不显示
        return false;
    };

    BootstrapTable.prototype.initPagination = function () {
        this.$pagination = this.$container.find('.fixed-table-pagination');

        if (!this.options.pagination) {
            return;
        }
        var that = this,
            html = [],
            i, from, to,
            $pageList,
            $first, $pre,
            $next, $last,
            $number,
            data = this.searchText ? this.data : this.options.data;

        if (this.options.sidePagination !== 'server') {
            this.options.totalRows = data.length;
        }

        this.totalPages = 0;
        if (this.options.totalRows) {
            this.totalPages = ~~((this.options.totalRows - 1) / this.options.pageSize) + 1;
        }
        if (this.totalPages > 0 && this.options.pageNumber > this.totalPages) {
            this.options.pageNumber = this.totalPages;
        }

        this.pageFrom = (this.options.pageNumber - 1) * this.options.pageSize + 1;
        this.pageTo = this.options.pageNumber * this.options.pageSize;
        if (this.pageTo > this.options.totalRows) {
            this.pageTo = this.options.totalRows;
        }

        html.push(
            // '<div class="pull-left pagination-detail">',
            '<div class="pull-left pagination-detail">',
                '<span class="pagination-info">',
                    this.options.formatShowingRows(this.pageFrom, this.pageTo, this.options.totalRows),
                '</span>');

        html.push('<span class="page-list">');

        var pageNumber = [
            '<span class="btn-group dropup">',
            '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">',
            '<span class="page-size">',
            this.options.pageSize,
            '</span>',
            ' <span class="caret"></span>',
            '</button>',
            '<ul class="dropdown-menu" role="menu">'],
            pageList = this.options.pageList;

        if (typeof this.options.pageList === 'string') {
            var list = this.options.pageList.slice(1, -1).replace(/ /g, '').split(',');

            pageList = [];
            $.each(list, function (i, value) {
                pageList.push(+value);
            });
        }

        $.each(pageList, function (i, page) {
            var active = page === that.options.pageSize ? ' class="active"' : '';
            pageNumber.push(sprintf('<li%s><a href="javascript:void(0)">%s</a></li>', active, page));
        });
        pageNumber.push('</ul></span>');

        html.push(this.options.formatRecordsPerPage(pageNumber.join('')));
        html.push('</span>');

        html.push('</div>',
            // '<div class="pull-right pagination">',
            '<div class="pull-right pagination">',
                '<ul class="pagination">',
                    '<li class="page-first"><a href="javascript:void(0)">&lt;&lt;</a></li>',
                    '<li class="page-pre"><a href="javascript:void(0)">&lt;</a></li>');

        if (this.totalPages < 5) {
            from = 1;
            to = this.totalPages;
        } else {
            from = this.options.pageNumber - 2;
            to = from + 4;
            if (from < 1) {
                from = 1;
                to = 5;
            }
            if (to > this.totalPages) {
                to = this.totalPages;
                from = to - 4;
            }
        }
        for (i = from; i <= to; i++) {
            html.push('<li class="page-number' + (i === this.options.pageNumber ? ' active' : '') + '">',
                '<a href="javascript:void(0)">', i, '</a>',
                '</li>');
        }

        html.push(
                    '<li class="page-next"><a href="javascript:void(0)">&gt;</a></li>',
                    '<li class="page-last"><a href="javascript:void(0)">&gt;&gt;</a></li>',
                '</ul>',
            '</div>');

        this.$pagination.html(html.join(''));

        $pageList = this.$pagination.find('.page-list a');
        $first = this.$pagination.find('.page-first');
        $pre = this.$pagination.find('.page-pre');
        $next = this.$pagination.find('.page-next');
        $last = this.$pagination.find('.page-last');
        $number = this.$pagination.find('.page-number');

        if (this.options.pageNumber <= 1) {
            $first.addClass('disabled');
            $pre.addClass('disabled');
        }
        if (this.options.pageNumber >= this.totalPages) {
            $next.addClass('disabled');
            $last.addClass('disabled');
        }
        $pageList.off('click').on('click', $.proxy(this.onPageListChange, this));
        $first.off('click').on('click', $.proxy(this.onPageFirst, this));
        $pre.off('click').on('click', $.proxy(this.onPagePre, this));
        $next.off('click').on('click', $.proxy(this.onPageNext, this));
        $last.off('click').on('click', $.proxy(this.onPageLast, this));
        $number.off('click').on('click', $.proxy(this.onPageNumber, this));
    };

    BootstrapTable.prototype.updatePagination = function () {
        if (!this.options.maintainSelected) {
            this.resetRows();
        }

        this.initPagination();
        if (this.options.sidePagination === 'server') {
            this.initServer();
        } else {
            this.initBody();
        }
    };

    BootstrapTable.prototype.onPageListChange = function (event) {
        var $this = $(event.currentTarget);

        $this.parent().addClass('active').siblings().removeClass('active');
        this.options.pageSize = +$this.text();
        this.$toolbar.find('.page-size').text(this.options.pageSize);
        this.updatePagination();
    };

    BootstrapTable.prototype.onPageFirst = function () {
        this.options.pageNumber = 1;
        this.updatePagination();
    };

    BootstrapTable.prototype.onPagePre = function () {
        this.options.pageNumber--;
        this.updatePagination();
    };

    BootstrapTable.prototype.onPageNext = function () {
        this.options.pageNumber++;
        this.updatePagination();
    };

    BootstrapTable.prototype.onPageLast = function () {
        this.options.pageNumber = this.totalPages;
        this.updatePagination();
    };

    BootstrapTable.prototype.onPageNumber = function (event) {
        if (this.options.pageNumber === +$(event.currentTarget).text()) {
            return;
        }
        this.options.pageNumber = +$(event.currentTarget).text();
        this.updatePagination();
    };

    BootstrapTable.prototype.initBody = function (fixedScroll) {
        if (this.options.treegrid) {
            this.inittreebody(fixedScroll);
            return;
        }
        var that = this,
            html = [],
            data = this.getData();

        this.$body = this.$el.find('tbody');
        if (!this.$body.length) {
            this.$body = $('<tbody></tbody>').appendTo(this.$el);
        }

        if (this.options.sidePagination === 'server') {
            data = this.data;
        }

        if (!this.options.pagination || this.options.sidePagination === 'server') {
            this.pageFrom = 1;
            this.pageTo = data.length;
        }

        for (var i = this.pageFrom - 1; i < this.pageTo; i++) {
            var item = data[i],
                style = {},
                csses = [];

            style = calculateFunctionValue(this.options, this.options.rowStyle, [item, i], style);

            if (style && style.css) {
                for (var key in style.css) {
                    csses.push(key + ': ' + style.css[key]);
                }
            }

            html.push('<tr',
                sprintf(' class="%s"', style.classes),
                sprintf(' data-index="%s"', i),
                '>'
            );

            if (this.options.cardView) {
                html.push(sprintf('<td colspan="%s">', this.header.fields.length));
            }

            $.each(this.header.fields, function (j, field) {
                var text = '',
                    value = item[field],
                    type = '',
                    cellStyle = {},
                    class_ = that.header.classes[j];
                style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));

                value = calculateFunctionValue(that.header,
                    that.header.formatters[j], [value, item, i], value);

                cellStyle = calculateFunctionValue(that.header,
                    that.header.cellStyles[j], [value, item, i], cellStyle);
                if (cellStyle.classes) {
                    class_ = sprintf(' class="%s"', cellStyle.classes);
                }
                if (cellStyle.css) {
                    csses = [];
                    for (var key in cellStyle.css) {
                        csses.push(key + ': ' + cellStyle.css[key]);
                    }
                    style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));
                }

                if (that.options.columns[j].checkbox || that.options.columns[j].radio) {
                    //if card view mode bypass
                    if (that.options.cardView) {
                        return true;
                    }

                    type = that.options.columns[j].checkbox ? 'checkbox' : type;
                    type = that.options.columns[j].radio ? 'radio' : type;

                    text = ['<td class="bs-checkbox">',
                        '<input' +
                            sprintf(' data-index="%s"', i) +
                            sprintf(' name="%s"', that.options.selectItemName) +
                            sprintf(' type="%s"', type) +
                            sprintf(' value="%s"', item[that.options.idField]) +
                            sprintf(' checked="%s"', value ? 'checked' : undefined) +
                            sprintf(' %s', that.options.columns[j].checkboxEnabled ? undefined : 'disabled') +
                            ' />',
                        '</td>'].join('');
                } else {
                    value = typeof value === 'undefined' ? that.options.undefinedText : value;

                    text = that.options.cardView ?
                        ['<div class="card-view">',
                            that.options.showHeader ? sprintf('<span class="title" %s>%s</span>', style,
                                getPropertyFromOther(that.options.columns, 'field', 'title', field)) : '',
                            sprintf('<span class="value">%s</span>', value),
                            '</div>'].join('') :
                        [sprintf('<td%s %s>', class_, style),
                            value,
                            '</td>'].join('');
                }

                html.push(text);
            });

            if (this.options.cardView) {
                html.push('</td>');
            }

            html.push('</tr>');
        }

        // show no records
        if (!html.length) {
            html.push('<tr class="no-records-found">',
                // sprintf('<td class="bootstrap_table_NoResult" colspan="%s">' + _bootstrap_table_GlobalString.bootstrap_table_NoResult + '</td>', this.header.fields.length),
                sprintf('<td class="bootstrap_table_NoResult" colspan="%s"><div class="no-data"><p class="no-data-img"></p><p>' + _bootstrap_table_GlobalString.bootstrap_table_NoResult + '</p></div></td>', this.header.fields.length),
                '</tr>');
        }

        this.$body.html(html.join(''));

        if (!fixedScroll) {
            this.$container.find('.fixed-table-body').scrollTop(0);
        }

        // click to select by column
        this.$body.find('> tr > td').off('click').on('click', function () {
            var $tr = $(this).parent();
            that.trigger('click-row', that.data[$tr.data('index')], $tr);
            // if click to select - then trigger the checkbox/radio click
            if (that.options.clickToSelect) {
                if (that.header.clickToSelects[$tr.children().index($(this))]) {
                    $tr.find(sprintf('[name="%s"]',
                        that.options.selectItemName)).trigger('click');
                }
            }
        });
        this.$body.find('tr').off('dblclick').on('dblclick', function () {
            that.trigger('dbl-click-row', that.data[$(this).data('index')], $(this));
        });

        this.$selectItem = this.$body.find(sprintf('[name="%s"]', this.options.selectItemName));
        this.$selectItem.off('click').on('click', function (event) {
            event.stopImmediatePropagation();

            // radio trigger click event bug!
            if ($(this).is(':radio')) {
                $(this).prop('checked', true);
            }

            var checkAll = that.$selectItem.length === that.$selectItem.filter(':checked').length,
                checked = $(this).prop('checked'),
                row = that.data[$(this).data('index')];

            that.$selectAll.add(that.$selectAll_).prop('checked', checkAll);
            row[that.header.stateField] = checked;
            that.trigger(checked ? 'check' : 'uncheck', row);

            if (that.options.singleSelect) {
                that.$selectItem.not(this).each(function () {
                    that.data[$(this).data('index')][that.header.stateField] = false;
                });
                that.$selectItem.filter(':checked').not(this).prop('checked', false);
            }

            that.updateSelected();
        });

        $.each(this.header.events, function (i, events) {
            if (!events) {
                return;
            }
            if (typeof events === 'string') {
                events = window[events];
            }
            for (var key in events) {
                that.$body.find('tr').each(function () {
                    var $tr = $(this),
                        $td = $tr.find('td').eq(i),
                        index = key.indexOf(' '),
                        name = key.substring(0, index),
                        el = key.substring(index + 1),
                        func = events[key];

                    $td.find(el).off(name).on(name, function (e) {
                        var index = $tr.data('index'),
                            row = that.data[index],
                            value = row[that.header.fields[i]];
                        func(e, value, row, index);
                    });
                });
            }
        });

        this.updateSelected();
        this.resetView();
    };

    //Add By CHC 构造树表格
    BootstrapTable.prototype.inittreebody = function (fixedScroll) {
        var that = this,
            html = [],
            data = this.getData();

        this.$body = this.$el.find('tbody');
        if (!this.$body.length) {
            this.$body = $('<tbody></tbody>').appendTo(this.$el);
        }

        if (this.options.sidePagination === 'server') {
            data = this.data;
        }

        if (!this.options.pagination || this.options.sidePagination === 'server') {
            this.pageFrom = 1;
            this.pageTo = data.length;
        }

        for (var i = this.pageFrom - 1; i < this.pageTo; i++) {
            var item = data[i];
            this.initTreeBodyRow(that, html, item, i);
        }

        // show no records
        if (!html.length) {
            html.push('<tr class="no-records-found">',
                // sprintf('<td class="bootstrap_table_NoResult" colspan="%s">' + _bootstrap_table_GlobalString.bootstrap_table_NoResult + '</td>', this.header.fields.length),
                sprintf('<td class="bootstrap_table_NoResult" colspan="%s"><div class="no-data"><p class="no-data-img"></p><p>' + _bootstrap_table_GlobalString.bootstrap_table_NoResult + '</p></div></td>', this.header.fields.length),
                '</tr>');
        }

        this.$body.html(html.join(''));

        if (!fixedScroll) {
            this.$container.find('.fixed-table-body').scrollTop(0);
        }

        //add by chc 调整数据
        that.data = [];
        this.ajustTreeData(that.data, data, "");
        //for (var i in data) {
        //    that.data[i] = data[i];
        //    if (data[i].children != null && data[i].children.length > 0) {
        //        for (var j in data[i].children) {
        //            that.data[i + "_" + j] = data[i].children[j];
        //        }
        //    }
        //}

        // click to select by column
        this.bindClickEvent();
        
        this.$body.find('tr').off('dblclick').on('dblclick', function () {
            that.trigger('dbl-click-row', that.data[$(this).data('index')], $(this));
        });

        this.$selectItem = this.$body.find(sprintf('[name="%s"]', this.options.selectItemName));
        this.$selectItem.off('click').on('click', function (event) {
            event.stopImmediatePropagation();

            // radio trigger click event bug!
            if ($(this).is(':radio')) {
                $(this).prop('checked', true);
            }

            var checkAll = that.$selectItem.length === that.$selectItem.filter(':checked').length,
                checked = $(this).prop('checked'),
                row = that.data[$(this).data('index')];

            that.$selectAll.add(that.$selectAll_).prop('checked', checkAll);
            row[that.header.stateField] = checked;
            that.trigger(checked ? 'check' : 'uncheck', row);

            if (that.options.singleSelect) {
                that.$selectItem.not(this).each(function () {
                    that.data[$(this).data('index')][that.header.stateField] = false;
                });
                that.$selectItem.filter(':checked').not(this).prop('checked', false);
            }

            that.updateSelected();
        });

        $.each(this.header.events, function (i, events) {
            if (!events) {
                return;
            }
            if (typeof events === 'string') {
                events = window[events];
            }
            for (var key in events) {
                that.$body.find('tr').each(function () {
                    var $tr = $(this),
                        $td = $tr.find('td').eq(i),
                        index = key.indexOf(' '),
                        name = key.substring(0, index),
                        el = key.substring(index + 1),
                        func = events[key];

                    $td.find(el).off(name).on(name, function (e) {
                        var index = $tr.data('index'),
                            row = that.data[index],
                            value = row[that.header.fields[i]];

                        func(e, value, row, index);
                    });
                });
            }
        });

        this.updateSelected();
        this.resetView();
    };
    
    //add by luwei
     BootstrapTable.prototype.bindClickEvent = function () {
     	var that = this;
     	this.$body.find('> tr > td').off('click').on('click', function () {
            var $tr = $(this).parent();
            if (!$tr.hasClass("whitesmoke")) {
            	return;
            }
            that.trigger('click-row', that.data[$tr.data('index')], $tr);
            // if click to select - then trigger the checkbox/radio click
            if (that.options.clickToSelect) {
                if (that.header.clickToSelects[$tr.children().index($(this))]) {
                    $tr.find(sprintf('[name="%s"]',
                        that.options.selectItemName)).trigger('click');
                }
            }

            if ($tr.attr("data-childrenkey") == null || $tr.attr("data-childrenkey") == "") return;
            
            //add by luwei
            var children = $("tr[data-parentkey='" + $tr.attr("data-childrenkey") + "']");
            if (children.length === 0) {
            	var rowChildrenUrl = that.options.rowChildrenUrl;
            	var rowChildrenParamString = $tr.data("childrenurl");
            	if (rowChildrenUrl && rowChildrenUrl.length > 0  && rowChildrenParamString.length > 0) {
            		var _that = that;
            		$.ajax({
	            		type:"get",
	            		async:false,
	            		url: rowChildrenUrl + "?" + rowChildrenParamString,
	            		success:function(data) {
	            			if (data) {
	            				var html = [];
						        for (var i in data) {
						            var item = data[i];
						            _that.initTreeBodyRow(_that, html, item, i, $tr.data("childrenkey"));
						        }
						        $tr.after(html.join(''));
						        _that.bindClickEvent();//绑定子菜单事件，此处为全部刷新绑定了
						        
						        $.each(_that.header.events, function (i, events) {
						            if (!events) {
						                return;
						            }
						            if (typeof events === 'string') {
						                events = window[events];
						            }
						            for (var key in events) {
						                _that.$body.find('tr').each(function () {
						                    var $tr = $(this);
						                    if ($tr.hasClass("whitesmoke")) {
								            	return;
								            }
								            
								            var $td = $tr.find('td').eq(i),
					                        index = key.indexOf(' '),
					                        name = key.substring(0, index),
					                        el = key.substring(index + 1),
					                        func = events[key];
					                        
						                    $td.find(el).off(name).on(name, function (e) {
						                        var index = $tr.data('index'),
						                            row = _that.data[index],
						                            value = row[_that.header.fields[i]];
						
						                        func(e, value, row, index);
						                    });
						                });
						            }
						        });
						        
						        _that.trigger('load-success', data);
	            			}
	            		},
	            		error : function(a1, a2, a3) {
	            			console.log(error);
	            		}
	            	})
            	}
            }

            var $span = $tr.find("span[class^=glyphicon]");
            if ($span.hasClass("glyphicon-plus")) {
                $span.removeClass("glyphicon-plus");
                $span.addClass("glyphicon-minus");
                //$("tr[data-parentkey='" + $tr.attr("data-childrenkey") + "']").show();
                that.showRow($("tr[data-parentkey='" + $tr.attr("data-childrenkey") + "']"), that);
            }
            else if ($span.hasClass("glyphicon-minus")) {
                $span.addClass("glyphicon-plus");
                $span.removeClass("glyphicon-minus");
                //$("tr[data-parentkey='" + $tr.attr("data-childrenkey") + "']").hide();
                that.hideRow($("tr[data-parentkey='" + $tr.attr("data-childrenkey") + "']"), that);
            }
        });
     };
    

    //Add By CHC 显示行
    BootstrapTable.prototype.showRow = function (trRows, that) {
        trRows.show();

        //trRows.each(function () {
        //    var $tr = $(this);
        //    if ($tr.attr("data-childrenkey") != null && $tr.attr("data-childrenkey") != "") {
        //        that.showRow($("tr[data-parentkey='" + $tr.attr("data-childrenkey") + "']"), that);
        //    }
        //});
    };

    //Add By CHC  隐藏行
    BootstrapTable.prototype.hideRow = function (trRows, that) {
        trRows.hide();

        trRows.each(function () {
            var $tr = $(this);


            if ($tr.attr("data-childrenkey") != null && $tr.attr("data-childrenkey") != "") {
                var $span = $tr.find("span[class^=glyphicon]");
                if ($span.hasClass("glyphicon-minus")) {
                    $span.addClass("glyphicon-plus");
                    $span.removeClass("glyphicon-minus");
                }
                that.hideRow($("tr[data-parentkey='" + $tr.attr("data-childrenkey") + "']"), that);
            }
        });
    };

    //Add By CHC 修复树数据
    BootstrapTable.prototype.ajustTreeData = function (data, sourcedata, pathstr) {
        if (sourcedata == null || sourcedata.length == 0) return;

        for (var i in sourcedata) {
            var path = pathstr + i;
            data[path] = sourcedata[i];
            if (sourcedata[i].children != null && sourcedata[i].children.length > 0) {
                this.ajustTreeData(data, sourcedata[i].children, path + "_");
            }
        }
    };

    //Add By CHC 初始化树列
    BootstrapTable.prototype.initTreeBodyRow = function (that, html, item, i, parentpath) {
    	//处理报表跟发起流程不兼容，当传递的参数为function时不渲染树形。
    	if(typeof item == "function"){ return;};
        var style = {},
            csses = [];
        if (parentpath == null) parentpath = "";

        var haschildren = item.children != null && item.children.length > 0;
        
        //add by luwei
        var isLeaf = item.IsLeaf;

        style = calculateFunctionValue(this.options, this.options.rowStyle, [item, i], style);

        if (style && style.css) {
            for (var key in style.css) {
                csses.push(key + ': ' + style.css[key]);
            }
        }
        
        var rowChildrenParamColumn = this.options.rowChildrenParamColumn;
        var rowChildrenParamString = "";
        if (rowChildrenParamColumn && rowChildrenParamColumn.length > 0) {
        	for(var _i in rowChildrenParamColumn) {
        		if(_i == "0"){
        			var _column = rowChildrenParamColumn[_i];
            		var _value = item[_column];
            		rowChildrenParamString = rowChildrenParamString + "," + _column + "=" + _value;
        		}
        	}
        }
        if(rowChildrenParamString.length > 0) {
        	rowChildrenParamString = rowChildrenParamString.substring(1);
        }

        html.push('<tr',
            sprintf(' class="%s"', style.classes),
            sprintf(' data-index="%s"', parentpath + i),
            sprintf(' data-parentkey="%s"', parentpath),
            sprintf(' data-childrenkey="%s"', parentpath + i + "_"),
            sprintf(' data-childrenurl="%s"', rowChildrenParamString),
            '>'
        );
        
        this.data[parentpath + i] = item;

        if (this.options.cardView) {
            html.push(sprintf('<td colspan="%s">', this.header.fields.length));
        }
        
        //add by luwei
        var autoExpand = this.options.autoExpand;
        var expandFirst = this.options.expandFirst;
 		var isSearchMode = this.searchText;
 
        $.each(this.header.fields, function (j, field) {
            var text = '',
                value = item[field],
                type = '',
                cellStyle = {},
                spanStr = $("<div></div>"),
                class_ = that.header.classes[j];
            style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));

            value = calculateFunctionValue(that.header,
                that.header.formatters[j], [value, item, i], value);

            if (j == 0) {
                for (var k = 0; k < parentpath.length; k++) {
                    spanStr.append('<span style="width:18px;display:inline-block;position:relative;"></span>');
                }
            }

            if (!isLeaf && j == 0) {
            	if (autoExpand || isSearchMode) {
	                spanStr.append("<span class='glyphicon-minus'></span>");
            	} else {
            		if (expandFirst && i === 0 && item.children && item.children.length > 0) {
            			spanStr.append("<span class='glyphicon-minus'></span>");
            		} else {
            			spanStr.append("<span class='glyphicon-plus'></span>");
            		}
            	}
            }

            cellStyle = calculateFunctionValue(that.header,
                that.header.cellStyles[j], [value, item, i], cellStyle);
            if (cellStyle.classes) {
                class_ = sprintf(' class="%s"', cellStyle.classes);
            }
            if (cellStyle.css) {
                csses = [];
                for (var key in cellStyle.css) {
                    csses.push(key + ': ' + cellStyle.css[key]);
                }
                style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));
            }

            if (that.options.columns[j].checkbox || that.options.columns[j].radio) {
                //if card view mode bypass
                if (that.options.cardView) {
                    return true;
                }

                type = that.options.columns[j].checkbox ? 'checkbox' : type;
                type = that.options.columns[j].radio ? 'radio' : type;

                text = ['<td class="bs-checkbox">',
                    spanStr.html() + '<input' +
                        sprintf(' data-index="%s"', i) +
                        sprintf(' name="%s"', that.options.selectItemName) +
                        sprintf(' type="%s"', type) +
                        sprintf(' value="%s"', item[that.options.idField]) +
                        sprintf(' checked="%s"', value ? 'checked' : undefined) +
                        sprintf(' %s', that.options.columns[j].checkboxEnabled ? undefined : 'disabled') +
                        ' />',
                    '</td>'].join('');
            } else {
                value = typeof value === 'undefined' ? that.options.undefinedText : value;

                text = that.options.cardView ?
                    ['<div class="card-view">',
                        that.options.showHeader ? sprintf('<span class="title" %s>%s</span>', style,
                            getPropertyFromOther(that.options.columns, 'field', 'title', field)) : '',
                        sprintf('<span class="value">%s</span>', value),
                        '</div>'].join('') :
                    [sprintf('<td%s %s>', class_, style),
                        spanStr.html() + value,
                        '</td>'].join('');
            }
            html.push(text);
        });

        if (this.options.cardView) {
            html.push('</td>');
        }

        html.push('</tr>');
        
        //update by luwei : 自动展开设置
		if (autoExpand || isSearchMode) {
			if (item.children != null && item.children.length > 0) {
	            for (var j = 0; j < item.children.length; j++) {
	                this.initTreeBodyRow(that, html, item.children[j], j, parentpath + i + "_");
	            }
        	}
		}
		else if (expandFirst) {
			if (i === 0) { //first row
				if (item.children != null && item.children.length > 0) {
		            for (var j = 0; j < item.children.length; j++) {
		                this.initTreeBodyRow(that, html, item.children[j], j, parentpath + i + "_");
		            }
	        	}
			}
		}
        
    }

    BootstrapTable.prototype.initServer = function (silent) {
        var that = this,
            data = {},
            params = {
                pageSize: this.options.pageSize,
                pageNumber: this.options.pageNumber,
                searchText: this.searchText,
                sortName: this.options.sortName,
                sortOrder: this.options.sortOrder
            };

        if (!this.options.url) {
            return;
        }
        if (!silent) {
            this.$loading.show();
        }

        if (this.options.queryParamsType === 'limit') {
            params = {
                limit: params.pageSize,
                offset: params.pageSize * (params.pageNumber - 1),
                search: params.searchText,
                sort: params.sortName,
                order: params.sortOrder
            };
        }
        data = calculateFunctionValue(this.options, this.options.queryParams, [params], data);

        $.ajax({
            type: this.options.method,
            url: this.options.url,
            data: data,
            cache: this.options.cache,
            contentType: this.options.contentType,
            dataType: 'json',
            success: function (res) {
                res = calculateFunctionValue(that.options, that.options.responseHandler, [res], res);

                var data = res;

                if (that.options.sidePagination === 'server') {
                    that.options.totalRows = res.total;
                    data = res.rows;
                }
                that.load(data);
                that.trigger('load-success', data);
            },
            error: function (res) {
                that.trigger('load-error', res.status);
            },
            complete: function () {
                if (!silent) {
                    that.$loading.hide();
                }
            }
        });
    };

    BootstrapTable.prototype.getCaretHtml = function () {
        return ['<span class="order' + (this.options.sortOrder === 'desc' ? '' : ' dropup') + '">',
                '<span class="caret" style="margin: 10px 5px;"></span>',
            '</span>'].join('');
    };

    BootstrapTable.prototype.updateSelected = function () {
        this.$selectItem.each(function () {
            $(this).parents('tr')[$(this).prop('checked') ? 'addClass' : 'removeClass']('selected');
        });
    };

    BootstrapTable.prototype.updateRows = function (checked) {
        var that = this;

        this.$selectItem.each(function () {
            that.data[$(this).data('index')][that.header.stateField] = checked;
        });
    };

    BootstrapTable.prototype.resetRows = function () {
        var that = this;

        $.each(this.data, function (i, row) {
            that.$selectAll.prop('checked', false);
            that.$selectItem.prop('checked', false);
            row[that.header.stateField] = false;
        });
    };

    BootstrapTable.prototype.trigger = function (name) {
        var args = Array.prototype.slice.call(arguments, 1);

        name += '.bs.table';
        this.options[BootstrapTable.EVENTS[name]].apply(this.options, args);
        this.$el.trigger($.Event(name), args);

        this.options.onAll(name, args);
        this.$el.trigger($.Event('all.bs.table'), [name, args]);
    };

    BootstrapTable.prototype.resetHeader = function () {
        var that = this,
            $fixedHeader = this.$container.find('.fixed-table-header'),
            $fixedBody = this.$container.find('.fixed-table-body'),
            scrollWidth = this.$el.width() > $fixedBody.width() ? getScrollBarWidth() : 0;

        // fix #61: the hidden table reset header bug.
        if (this.$el.is(':hidden')) {
            clearTimeout(this.timeoutId_); // doesn't matter if it's 0
            this.timeoutId_ = setTimeout($.proxy(this.resetHeader, this), 100); // 100ms
            return;
        }

        this.$header_ = this.$header.clone(true);
        this.$selectAll_ = this.$header_.find('[name="btSelectAll"]');

        // fix bug: get $el.css('width') error sometime (height = 500)
        setTimeout(function () {
            $fixedHeader.css({
                'height': '40px',
                'margin-right': scrollWidth
            }).find('table').css('width', that.$el.css('width'))
                .html('').attr('class', that.$el.attr('class'))
                .append(that.$header_);

            that.$el.css('margin-top', -that.$header.height());

            that.$body.find('tr:first-child:not(.no-records-found) > *').each(function (i) {
                that.$header_.find('div.fht-cell').eq(i).width($(this).innerWidth());
            });

            // horizontal scroll event
            $fixedBody.off('scroll').on('scroll', function () {
                $fixedHeader.scrollLeft($(this).scrollLeft());
            });
        });
    };

    BootstrapTable.prototype.toggleColumn = function (index, checked, needUpdate) {
        if (index === -1) {
            return;
        }
        this.options.columns[index].visible = checked;
        this.initHeader();
        this.initSearch();
        this.initPagination();
        this.initBody();

        if (this.options.showColumns) {
            var $items = this.$toolbar.find('.keep-open input').prop('disabled', false);

            if (needUpdate) {
                $items.filter(sprintf('[value="%s"]', index)).prop('checked', checked);
            }

            if ($items.filter(':checked').length <= this.options.minimumCountColumns) {
                $items.filter(':checked').prop('disabled', true);
            }
        }
    };

    // PUBLIC FUNCTION DEFINITION
    // =======================

    BootstrapTable.prototype.resetView = function (params) {
        var that = this,
            header = this.header;

        if (params && params.height) {
            this.options.height = params.height;
        }

        this.$selectAll.prop('checked', this.$selectItem.length > 0 &&
            this.$selectItem.length === this.$selectItem.filter(':checked').length);

        if (this.options.height) {
            var toolbarHeight = +this.$toolbar.children().outerHeight(true),
                paginationHeight = +this.$pagination.children().outerHeight(true),
                height = this.options.height - toolbarHeight - paginationHeight;

            this.$container.find('.fixed-table-container').css('height', height + 'px');
        }

        if (this.options.cardView) {
            // remove the element css
            that.$el.css('margin-top', '0');
            that.$container.find('.fixed-table-container').css('padding-bottom', '0');
            return;
        }

        if (this.options.showHeader && this.options.height) {
            this.resetHeader();
        }

        if (this.options.height && this.options.showHeader) {
            this.$container.find('.fixed-table-container').css('padding-bottom', '40px');
        }
    };

    BootstrapTable.prototype.getData = function () {
        return this.searchText ? this.data : this.options.data;
    };

    BootstrapTable.prototype.load = function (data) {
        this.initData(data);
        this.initSearch();
        this.initPagination();
        this.initBody();
    };

    BootstrapTable.prototype.append = function (data) {
        this.initData(data, true);
        this.initSearch();
        this.initPagination();
        this.initBody(true);
    };

    BootstrapTable.prototype.remove = function (params) {
        var len = this.options.data.length,
            i, row;

        if (!params.hasOwnProperty('field') || !params.hasOwnProperty('values')) {
            return;
        }

        for (i = len - 1; i >= 0; i--) {
            row = this.options.data[i];

            if (!row.hasOwnProperty(params.field)) {
                return;
            }
            if ($.inArray(row[params.field], params.values) !== -1) {
                this.options.data.splice(i, 1);
            }
        }

        if (len === this.options.data.length) {
            return;
        }

        this.initSearch();
        this.initPagination();
        this.initBody(true);
    };

    BootstrapTable.prototype.updateRow = function (params) {
        if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
            return;
        }
        $.extend(this.data[params.index], params.row);
        this.initBody();
    };

    BootstrapTable.prototype.mergeCells = function (options) {
        var row = options.index,
            col = $.inArray(options.field, this.header.fields),
            rowspan = options.rowspan || 1,
            colspan = options.colspan || 1,
            i, j,
            $tr = this.$body.find('tr'),
            $td = $tr.eq(row).find('td').eq(col);

        if (row < 0 || col < 0 || row >= this.data.length) {
            return;
        }

        for (i = row; i < row + rowspan; i++) {
            for (j = col; j < col + colspan; j++) {
                $tr.eq(i).find('td').eq(j).hide();
            }
        }

        $td.attr('rowspan', rowspan).attr('colspan', colspan)
            .show(10, $.proxy(this.resetView, this));
    };

    BootstrapTable.prototype.getSelections = function () {
        var that = this;

        return $.grep(this.data, function (row) {
            return row[that.header.stateField];
        });
    };

    BootstrapTable.prototype.checkAll = function () {
        this.$selectAll.add(this.$selectAll_).prop('checked', true);
        this.$selectItem.prop('checked', true);
        this.updateRows(true);
        this.updateSelected();
        this.trigger('check-all');
    };

    BootstrapTable.prototype.uncheckAll = function () {
        this.$selectAll.add(this.$selectAll_).prop('checked', false);
        this.$selectItem.prop('checked', false);
        this.updateRows(false);
        this.updateSelected();
        this.trigger('uncheck-all');
    };

    BootstrapTable.prototype.destroy = function () {
        this.$el.insertBefore(this.$container);
        $(this.options.toolbar).insertBefore(this.$el);
        this.$container.next().remove();
        this.$container.remove();
        this.$el.html(this.$el_.html())
            .attr('class', this.$el_.attr('class') || ''); // reset the class
    };

    BootstrapTable.prototype.showLoading = function () {
        this.$loading.show();
    };

    BootstrapTable.prototype.hideLoading = function () {
        this.$loading.hide();
    };

    BootstrapTable.prototype.refresh = function (params) {
        if (params && params.url) {
            this.options.url = params.url;
        }
        this.initServer(params && params.silent);
    };

    BootstrapTable.prototype.showColumn = function (field) {
        this.toggleColumn(getFieldIndex(this.options.columns, field), true, true);
    };

    BootstrapTable.prototype.hideColumn = function (field) {
        this.toggleColumn(getFieldIndex(this.options.columns, field), false, true);
    };


    // BOOTSTRAP TABLE PLUGIN DEFINITION
    // =======================

    $.fn.bootstrapTable = function (option, _relatedTarget) {
        var allowedMethods = [
                'getSelections', 'getData',
                'load', 'append', 'remove',
                'updateRow',
                'mergeCells',
                'checkAll', 'uncheckAll',
                'refresh',
                'resetView',
                'destroy',
                'showLoading', 'hideLoading',
                'showColumn', 'hideColumn'
        ],
            value;

        this.each(function () {
            var $this = $(this),
                data = $this.data('bootstrap.table'),
                options = $.extend({}, BootstrapTable.DEFAULTS, $this.data(),
                    typeof option === 'object' && option);

            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw "Unknown method: " + option;
                }

                if (!data) {
                    return;
                }

                value = data[option](_relatedTarget);

                if (option === 'destroy') {
                    $this.removeData('bootstrap.table');
                }
            }

            if (!data) {
                $this.data('bootstrap.table', (data = new BootstrapTable(this, options)));
            }
        });

        return typeof value === 'undefined' ? this : value;
    };

    $.fn.bootstrapTable.Constructor = BootstrapTable;
    $.fn.bootstrapTable.defaults = BootstrapTable.DEFAULTS;
    $.fn.bootstrapTable.columnDefaults = BootstrapTable.COLUMN_DEFAULTS;
    
    
    //兼容报表的boottrap-table.js，同名会导致异常
    $.fn.bootstrapTable2 = function (option, _relatedTarget) {
        var allowedMethods = [
                'getSelections', 'getData',
                'load', 'append', 'remove',
                'updateRow',
                'mergeCells',
                'checkAll', 'uncheckAll',
                'refresh',
                'resetView',
                'destroy',
                'showLoading', 'hideLoading',
                'showColumn', 'hideColumn'
        ],
            value;

        this.each(function () {
            var $this = $(this),
                data = $this.data('bootstrap.table'),
                options = $.extend({}, BootstrapTable.DEFAULTS, $this.data(),
                    typeof option === 'object' && option);

            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw "Unknown method: " + option;
                }

                if (!data) {
                    return;
                }

                value = data[option](_relatedTarget);

                if (option === 'destroy') {
                    $this.removeData('bootstrap.table');
                }
            }

            if (!data) {
                $this.data('bootstrap.table', (data = new BootstrapTable(this, options)));
            }
        });

        return typeof value === 'undefined' ? this : value;
    };

    $.fn.bootstrapTable2.Constructor = BootstrapTable;
    $.fn.bootstrapTable2.defaults = BootstrapTable.DEFAULTS;
    $.fn.bootstrapTable2.columnDefaults = BootstrapTable.COLUMN_DEFAULTS;
    // BOOTSTRAP TABLE INIT
    // =======================

    $(function () {
        $('[data-toggle="table"]').bootstrapTable();
    });

}(jQuery);