/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global Element, HTMLElement, NodeList, node_list, Window, HTMLDocument, data, settings, AJAX */

(function(window,undefined){

/**
 * ThinJS版本
 * @constant
 * @type {string}
 */
const VERSION = "1.0.0";

/**
 * 用户扩展模块
 * @constant
 * @type {Object}
 */
const moduleMap = {};

/**
 * ThinJS类
 * @class ThinJS
 * @classdesc ThinJS类
 */
class ThinJS{

    /**
     * ThinJS构造函数
     * @constructor ThinJS
     * @param {string|Array|NodeList|HTMLDocument|Window|Object} [selector] 可选，元素选择器。
     * @param {Object} [datas] 可选，定义模板数据对象。
     * @returns {ThinJS} ThinJS对象。
     */
    constructor(selector, datas){
        selector = selector || document;//初始化selector
    	this.elements = [];//存储当前匹配出的element元素数组
        this.events = {};//存储on/off事件添加或移除的事件
        if (!Element.prototype.matches) {//定义Element.matches功能，即判断当前元素是否匹配选择器
            Element.prototype.matches =
                Element.prototype.matchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector ||
                Element.prototype.oMatchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                function(s) {
                    let matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                    while (--i >= 0 && matches.item(i) !== this) {}
                    return i > -1;
                };
        }
        if(typeof selector === "string"){//判断传入的是字符串，即css选择器字符串。需要支持querySelectorAll功能
            if(document.querySelectorAll){
                let node_list = document.querySelectorAll(selector);
                for(var node = 0, len = node_list.length; node < len; node++){
                    if(node_list[node].tagName !== undefined){
                        this.elements.push(node_list[node]);
                    }
                }
            }else{
                ThinJS.error("ThinJS: This browser does not support function querySelectorAll.");
            }
        }else if(typeof selector === "object"){//判断传入的是object
            if(selector instanceof Array){
                this.elememts = selector;
            }else if(selector instanceof HTMLElement){
                this.elements.push(selector);
            }else if(selector instanceof NodeList){
                for(var node = 0, len = node_list.length; node < len; node++){
                    if(selector[node].tagName !== undefined){
                        this.elements.push(selector[node]);
                    }
                }
            }else if(selector instanceof HTMLDocument || selector instanceof Window){
                this.elements.push(selector);
            }else if(selector instanceof Object){
                for(var node = 0, len = node_list.length; node < len; node++){
                    if(selector[node].tagName !== undefined){
                        this.elements.push(selector[node]);
                    }
                }
            }else{
                ThinJS.error("ThinJS: Unknown type of elements.");
            }
        }else{
            ThinJS.error("ThinJS: Unknown type of elements.");
        }
        if(datas){
            let tpl = [];
            this.elements.forEach(element=>{
                tpl.push(element.innerHTML);
            });
            this.datas = datas;
            this.datas = new Proxy(this.datas,{
                get: (target, propKey, receiver)=>{
                    return target[propKey];
                },
                set: (target, propKey, value, receiver)=>{
                    target[propKey] = value;
                    thinjs_template(this.elements,tpl, this.datas);
                }
            });
            thinjs_template(this.elements,tpl, this.datas);
        }
        //加载用户自定义模块
        for(var item in moduleMap){
            this.__proto__[item] = moduleMap[item];
        }
    	return this;
    }
    
    /**
     * ThinJS类的实例化方法。
     * @param {string|Array|NodeList|HTMLDocument|Window|Object} selector 必须，元素选择器。
     * @param {Object} [data] 可选，定义模板数据对象。
     * @return {ThinJS} ThinJS对象。
     */
    static main(selector,data){
        return new ThinJS(selector,data);
    }

    /**
     * 扩展自定义函数方法。
     * @param {string} name 扩展的函数名。
     * @param {function} func 扩展的函数体。
     * @example
     * thinjs().define("length", function(){
     *     return this.elements.length;
     * });
     */
    define(name, func){
        moduleMap[name] = func;
    }

    /**
     * 返回当前ThinJS库版本。
     * @returns {String} 当前ThinJS库版本。
     * @example
     * thinjs().version;
     */
    get version(){
    	return VERSION;
    }
    
    /**
     * 返回匹配元素的数量。
     * @returns {integer} 匹配元素的数量。
     * @example
     * thinjs("div").length;
     */
    get length(){
    	return this.elements.length;
    }
    
    /**
     * 当文档加载后执行的事件。
     * @param {string} [element] 可选，需要判断为ready状态的元素。
     * @param {function} callback 必须，文档加载后运行的函数。
     * @example
     * thinjs(document).ready(function(){    
     * });
     */
    ready(callback){//页面DOM加载完
    	var d = this.elements[0];//需要判断已经为ready状态的元素
    	var f = callback;
    	var ie = !!(window.attachEvent && !window.opera);//判断是否为ie浏览器
    	var wk = /webkit\/(\d+)/i.test(navigator.userAgent) && (RegExp.$1 < 525);//判断是否为webkit内核浏览器
    	var fn = []; //利用函数数组，以便可以让ready时执行多个函数
    	var run = function(){ 
            for(var i = 0; i < fn.length; i++){
                fn[i]();
            }
    	}; 
    	//不是ie和webkit，并且具有addEventListener，则监听DOMContentLoaded事件触发为ready
    	if(!ie && !wk && d.addEventListener) return d.addEventListener('DOMContentLoaded', f, false);
    	if(fn.push(f) > 1) return; 
    	if(ie) //ie浏览器则判断doScroll可以运行为ready
            (function(){ 
                try{    
                    d.documentElement.doScroll('left');
                    run();     
                }catch(err){     
                    setTimeout(arguments.callee, 0);     
                } 
            })(); 
        else if(wk) //webkit则读取readyState状态信息判断ready
            var t = setInterval(function(){ 
                if (/^(loaded|complete)$/.test(d.readyState)) 
                    clearInterval(t), run(); 
            }, 0); 
    }
	
    /**
     * 获取当前匹配到的指定位置的元素，从零起始。
     * @param {integer} num 必须，指定位置。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").eq(0);
     */
    eq(num){//获取当前匹配到的第几个元素，从零算起
    	this.elements = [this.elements[parseInt(num)]] || [];
    	return this;
    }
    
    /**
     * 排除符合条件的元素。
     * @param {string} selector 必须，排除条件。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").not(".index");
     */
    not(selector){//排除那些符合条件的元素
        this.elements = this.elements.filter(function(e){
            return !e.matches(selector);
        });
        return this;
    }
    
    /**
     * 过滤符合条件的元素。
     * @param {string} selector 必须，过来条件。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").ready(".active");
     */
    filter(selector){//过滤那些符合条件的元素
        this.elements = this.elements.filter(function(e){
            return e.matches(selector);
        });
        return this;
    }
    
    /**
     * 获取或设置被选元素的html内容。
     * @param {string} [str] 可选，html字符串。
     * @return {mixed} ThinJS对象|被选元素的html内容。
     * @example
     * thinjs("div").html();
     * @example
     * thinjs("div").html("<span>This is a testing text.</span>");
     */
    html(){//获取或设置innerHTML。为空白即获取，传进参数即设置
        if(arguments[0] !== undefined){//传进参数
            var args = arguments;
            this.elements.forEach(function(e){
                e.innerHTML = args[0];//设置innerHTML
            });
        }else{//没有传参
            if(this.elements.length > 1){//匹配到的元素个数大于1
                var ret = [];
                this.elements.forEach(function(e){
                    ret.push(e.innerHTML);//获取内容
                });
                return ret;
            }else if(this.elements.length === 1){//匹配到的元素小于等于1
                return this.elements[0].innerHTML;
            }else{
                return "";
            }
        }
        return this;
    }
    
    /**
     * 获取或设置被选元素的text内容。
     * @param {string} [str] 可选，text字符串。
     * @return {mixed} ThinJS对象|被选元素的text内容。
     * @example
     * thinjs("span").text();
     * @example
     * thinjs("span").text("This is a testing text.");
     */
    text(){//等同于html
        if(arguments[0] !== undefined){
            var args = arguments;
            this.elements.forEach(function(e){
                e.innerTEXT = args[0];
            });
        }else{
            if(this.elements.length > 1){
                var ret = [];
                this.elements.forEach(function(e){
                    ret.push(e.innerTEXT);
                });
                return ret;
            }else if(this.elements.length === 1){
                return this.elements[0].innerTEXT;
            }else{
                return "";
            }
        }
        return this;
    }

    /**
     * 向被选元素的前面添加内容。
     * @param {string} str 必须，需要添加的内容。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").before("This is the content added through before.");
     */
    before(str){
        if(!str)ThinJS.error("function before(): Paras should not empty.");
        this.elements.forEach(function(e){
            e.innerHTML = str + e.innerHTML;//设置innerHTML
        });
        return this;
    }
    
    /**
     * 向被选元素的后面添加内容。
     * @param {string} str 必须，需要添加的内容。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").after("This is the content added through after.");
     */
    after(str){
        if(!str)ThinJS.error("function after(): Paras should not empty.");
        this.elements.forEach(function(e){
            e.innerHTML = e.innerHTML + str;//设置innerHTML
        });
        return this;
    }
    
    /**
     * 清空被选元素的内容。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").empty();
     */
    empty(){//清空当前元素的内容
        this.elements.forEach(function(e){
            e.innerHTML = "";//清空innerHTML
            e.hasAttribute("input") ? e.setAttribute("input","") : {};//如果有，清空input属性
        });
        return this;
    }
    
    /**
     * 判断被选元素是否为空。
     * @return {boolean|array} 被选元素是否为空。
     * @example
     * thinjs("div").isEmpty();
     */
    isEmpty(){//判断当前元素，以及元素的内容是否为空
        if(this.elements.length === 0){
            return true;
        }else if(this.elements.length === 1){
            var cnt = (this.elements[0].innerHTML || this.elements[0].innerTEXT || this.elements[0].childNodes.length) ? false : true;
            return cnt;
        }else{
            var ret = [];
            this.elements.forEach(function(e){
                var cnt = (e.innerHTML || e.innerTEXT || e.childNodes.length) ? false : true;
                ret.push(cnt);
            });
            return ret;
        }
        return this;
    }
    
    /**
     * 为每一个被选元素执行相同的方法。
     * @param {function} callback 必须，执行的函数。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").each(function(){    
     * });
     */
    each(callback){//遍历每一个匹配到的元素
        this.elements.forEach(callback);
        return this;
    }

    /**
     * 为每一个被选元素执行相同的方法。
     * @param {function} callback 必须，执行的函数。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").foreach(function(){    
     * });
     */
    foreach(callback){//遍历每一个匹配到的元素
        this.elements.forEach(callback);
        return this;
    }

    /**
     * 为每一个被选元素执行相同的方法。
     * @param {function} callback 必须，执行的函数。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").forEach(function(){    
     * });
     */
    forEach(callback){//遍历每一个匹配到的元素
        this.elements.forEach(callback);
        return this;
    }

    /**
     * 获取被选元素的兄弟元素。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div#myDiv").siblings(function(){    
     * });
     */
    siblings(){//获取匹配到的元素的兄弟元素
        var ret = [];
        var p = this.elements[0].parentNode.firstChild;
        while(p = p.nextSibling){
            if(p.nodeType !== 1)continue;
            if(this.elements.includes(p))continue;
            if((arguments[0] && p.matches(arguments[0])) || (!arguments[0])){
                ret.push(p);
            }
        }
        this.elements = ret;
        return this;
    }

    /**
     * 向被选元素添加一个或多个事件处理程序。
     * @param {string} event 必须，事件名，多个则用空格隔开。
     * @param {string} [childSelector] 可选，规定只能添加到指定的子元素上的事件处理程序。
     * @param {function} callback 必须，当事件发生时运行的函数。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").on("click", function(){    
     * });
     * @example
     * thinjs("div").on("click", "#myDiv", function(){    
     * });
     */
    on(){//等同于addEventListener。只不过如果传入三个参数，即代表代理事件
        var that = this.events;
        var args = arguments;
        if(args.length < 2 || args.length > 3) ThinJS.error("function on(): The num of paras should be 2 or 3.");
        var parentNode = this.elements;
        var events = args[0];//传入的第一个参数必须是事件名。可以有多个事件，使用空格分开
        var callback = args[args.length - 1];
        events = events.replace(/^[\s]*(.*?)[\s]*$/g, "$1");//删除前后的空格
        events = events.split(" ");//使用空格作为分隔符，分隔成数组
        events.forEach(function(event){//遍历每一个事件名
            if(!that[event]){//是否有事件名的数组（如click），没有就创建
                that[event] = [];
                that[event].push(callback);//把callback添加进当前事件名的数组
                parentNode.forEach(function(element){//当前匹配到的所有元素都要执行
                    if(element.addEventListener){
                        element.addEventListener(event, function(e){//原理就是：循环执行事件名数组里面的每一个function
                            var theEvent = e || window.event;
                            if(args.length === 3){
                                var selector = args[1];
                                var target = theEvent.target || theEvent.srcElement;
                                if(target.matches(selector)){
                                    for(var i = 0, len = that[event].length; i < len; i++){
                                        that[event][i](theEvent);
                                    }
                                }
                            }else{
                                for(var i = 0, len = that[event].length; i < len; i++){
                                    that[event][i](theEvent);
                                }
                            }
                        });
                    }else{
                        element.attachEvent("on"+event,function(e){
                            var theEvent = e || window.event;
                            if(args.length === 3){
                                var selector = args[1];
                                var target = theEvent.target || theEvent.srcElement;
                                if(target.matches(selector)){
                                    for(var i = 0, len = that[event].length; i < len; i++){
                                        that[event][i](theEvent);
                                    }
                                }
                            }else{
                                for(var i = 0, len = that[event].length; i < len; i++){
                                    that[event][i](theEvent);
                                }
                            }
                        });
                    }
                });
            }else{
                that[event].push(callback);
            }
        });
        return this;
    }
	
    /**
     * 向被选元素移除一个或多个事件处理程序。
     * @param {string} eventName 必须，要移除的事件名。
     * @param {function} [function] 可选，要移除的方法。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").off("click");
     * @example
     * thinjs("div").off("click", function(){    
     * });
     */
    off(){//removeEventListener，参数1：要移除的事件名（如click），参数2：要移除的方法（如function()）
        var args = arguments;
        switch(args.length){
            case 0:
                Object.keys(this.events).forEach(function(e){
                    this.events[e].length = 0;
                });
                this.events = {};
                break;
            case 1:
                this.events[args[0]] ? this.events[args[0]].length = 0 : {};
                break;
            case 2:
                if(this.events[args[0]]){
                    for(var i = 0, len = this.events[args[0]].length; i < len; i++){
                        if(this.events[args[0]][i] === args[1]){
                            this.events[args[0]].splice(i, 1);
                            break;
                        }
                    }
                }
                break;
            default:
                ThinJS.error("function off(): The num of patas should be less than 3.");
                break;
        }
        return this;
    }
    
    /**
     * 判断被选元素是否包含指定的元素。
     * @param {string|HTMLElement} node 必须，元素。
     * @return {boolean} 是否包含指定的元素。
     * @example
     * thinjs("div").conatins("I am a text.");
     * @example
     * thinjs("div").contains("span");
     */
    contains(node){//判断当前是否包含指定的元素
        if(!node)ThinJS.error("function contains(): Paras should not be empty.");
        if(typeof node === "string"){
            var ret = false;
            this.elements.forEach(function(e){
                if(e.matches(node)){
                    ret = true;
                }
            });
            return ret;
        }else{
            return this.elements.includes((node).elements[0]);
        }
    }
    
    /**
     * 从被选元素中，返回选定的元素。
     * @param {int} start 必须，规定从何处开始选取。
     * @param {int} [end] 可选，规定从何处结束选取。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").slice(1);
     * @example
     * thinjs("div").slice(1, 3);
     */
    slice(){//返回选定的元素
        if(!arguments[0])ThinJS.error("function slice(): Paras should not empty.");
        var elements = this.elements;
        this.elements = Array.prototype.slice.call(elements, ...arguments);
        return this;
    }
    
    /**
     * 为选取元素添加指定class。
     * @param {string} className 必须，class名称。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").addClass(".active");
     */
    addClass(className){//添加class
        if(!className)ThinJS.error("function addClass(): Paras should not empty.");
        for(var i = 0, len = this.elements.length; i < len; i++){
            var classAttr = this.elements[i].attributes.getNamedItem("class");
            if(classAttr){
                var classStr = classAttr.textContent;
                classStr = classStr.trim();
                classStr = classStr.replace(/\s+/g, " ");
                var classes = classStr.split(" ");
                classStr = "";
                if(!classes.includes(className))classes.push(className);
                this.elements[i].getAttributeNode("class").value = classes.join(" ");
            }else{
                var typ=document.createAttribute("class");
                typ.nodeValue = className;
                this.elements[i].attributes.setNamedItem(typ);
            }
        }
        return this;
    }
    
    /**
     * 为被选元素移除指定class。
     * @param {string} className 必须，class名称。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").removeClass(".active");
     */
    removeClass(className){//移除class
        if(!className)ThinJS.error("function removeClass(): Paras should not empty.");
        for(var i = 0, len = this.elements.length; i < len; i++){
            var classAttr = this.elements[i].attributes.getNamedItem("class");
            if(classAttr){
                var classStr = classAttr.textContent;
                classStr = classStr.trim();
                classStr = classStr.replace(/\s+/g, " ");
                var classes = classStr.split(" ");
                classStr = className;
                classes = classes.filter(function(e){
                    return e !== classStr;
                });
                this.elements[i].getAttributeNode("class").value = classes.join(" ");
            }
        }
        return this;
    }
    
    /**
     * 判断被选元素是否拥有class或指定的class。
     * @param {string} [className] 可选，class名称。
     * @return {boolean|array} 是否拥有class或指定的class。
     * @example
     * thinjs("div").hasClass();
     * @example
     * thinjs("div").hasClass("active");
     */
    hasClass(className){//判断拥有class
        if(this.elements.length === 1){
            var classAttr = this.elements[0].attributes.getNamedItem("class");
            if(classAttr){//拥有class属性，则依据把class转换成数组，利用数组的includes()功能判断是否包含指定class
                var classStr = classAttr.textContent;
                classAttr = null;
                classStr = classStr.trim();
                classStr = classStr.replace(/\s+/g, " ");
                var classes = classStr.split(" ");
                classStr = "";
                if(className){
                    return classes.includes(className);
                }else{
                    return !!classes.length;
                }
            }else{//没有class属性，则直接返回false
                return false;
            }
        }else{
            var ret = [];
            for(var i = 0, len = this.elements.length; i < len; i++){
                var classAttr = this.elements[i].attributes.getNamedItem("class");
                if(classAttr){
                    var classStr = classAttr.textContent;
                    classAttr = null;
                    classStr = classStr.trim();
                    classStr = classStr.replace(/\s+/g, " ");
                    var classes = classStr.split(" ");
                    classStr = "";
                    if(className){
                        ret.push(classes.includes(className));
                    }else{
                        ret.push(!!classes.length);
                    }
                }else{
                    ret.push(false);
                }
            }
            return ret;
        }
    }
    
    /**
     * 被选元素切换指定class。
     * @param {string} className 必须，class名称。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").toggleClass("active");
     */
    toggleClass(className){//切换指定的class，即已添加则移除，不存在则添加
        if(this.hasClass(className)){
            this.removeClass(className);
        }else{
            this.addClass(className);
        }
        return this;
    }
    
    /**
     * 获取或设置被选元素的class或指定class。
     * @param {string} [className] 可选，设置指定class名称。
     * @return {mixed} ThinJS对象|class名称。
     * @example
     * thinjs("div").class();
     * @example
     * thinjs("div").class("active");
     */
    class(){//获取或设置class
        var args = arguments;
        switch(args.length){
            case 0://查询返回所有class
                if(this.elements.length === 1){
                    var classes = this.elements[0].getAttributeNode("class");
                    if(classes){
                        return classes.value;
                    }else{
                        return "";
                    }
                }else if(this.elements.length > 1){
                    var ret = [];
                    for(var i = 0, len = this.elements.length; i < len; i++){
                        var classes = this.elements[i].getAttributeNode("class");
                        if(classes){
                            ret.push(classes.value);
                        }else{
                            ret.push("");
                        }
                    }
                    return ret;
                }else{
                    return "";
                }
                break;
            case 1://设置指定class
                return this.addClass(arguments[0]);
                break;
            case 2://抛错
                ThinJS.error("function class(): The num of paras should be less than or equal 1.");
                break;
        }
        return "";
    }
    
    /**
     * 获取或设置被选元素的应用样式。
     * @param {array|object|string} [styleName] 可选，样式名称数组|样式键值数组|样式名称。
     * @param {string} [styleContent] 可选，样式内容。
     * @return {mixed} ThinJS对象|样式内容。
     * @example
     * thinjs("div").style();
     * @example
     * thinjs("div").style("height");
     * @example
     * thinjs("div").style(["height","width"]);
     * @example
     * thinjs("div").style({height:"100px", width:"50px"});
     * @example
     * thinjs("div").style([{height:"100px"}, {width:"50px"}]);
     * @example
     * thinjs("div").style("height", "100px").width("width", "50px");
     */
    style(){//获取或设置style
        switch(arguments.length){
            case 0://获取当前的样式数组
                if(this.elements.length === 1){
                    return thinjs_getStyle(this.elements[0]);
                }else if(this.elements.length > 1){
                    var ret = [];
                    for(var i = 0, len = this.elements.length; i < len; i++){
                        ret.push(thinjs_getStyle(this.elements[i]));
                    }
                    return ret;
                }
                return null;
                break;
            case 1://通过字符串"styleName"、数组["styleName1", "styleName2"]获取指定样式内容，或者通过对象{styleName1: style1, styleName2: style2}、数组[{styleName1: style1}, {styleName2: style2}]形式设置样式
                if(typeof arguments[0] === "string"){//通过字符串查询
                    if(this.elements.length === 1){
                        return thinjs_getStyle(this.elememts[0])[arguments[0]];
                    }else if(this.elements.length > 1){
                        var ret = [];
                        for(var i = 0, len = this.elements.length; i < len; i++){
                            ret.push(thinjs_getStyle(this.elememts[i])[arguments[0]]);
                        }
                        return ret;
                    }
                    return null;
                }else if(arguments[0] instanceof Array){//通过数组查询或设置
                    var arr = arguments[0];
                    if(typeof arr[0] === "string"){//通过数组查询
                        if(this.elements.length === 1){
                            var ret = {};
                            for(var i = 0, len = arr.length; i < len; i++){
                                ret[arr[i]]=thinjs_getStyle(this.elements[0])[arr[i]];
                            }
                            return ret;
                        }else if(this.elements.length > 1){
                            var ret = [];
                            for(var i = 0, len = this.elements.length; i < len; i++){
                                var res = {};
                                for(var i = 0, len = arr.length; i < len; i++){
                                    ret[arr[j]]=thinjs_getStyle(this.elements[i])[arr[j]];
                                }
                                ret.push(res);
                            }
                            return ret;
                        }
                        return null;
                    }else{//通过数组包含对象形式设置
                        for(var i = 0, len = arr.length; i < len; i++){
                            this.elements.forEach(function(e){
                                thinjs_setStyle(e, Object.keys(arr[i])[0], Object.values(arr[i])[0]);
                            });
                        }
                        return this;
                    }
                }else{//通过对象形式设置
                    var keys = Object.keys(arguments[0]);
                    var values = Object.values(arguments[0]);
                    for(var i = 0, len = keys.length; i < len; i++){
                        this.elements.forEach(function(e){
                            thinjs_setStyle(e, keys[i], values[i]);
                        });
                    }
                    return this;
                }
                break;
            case 2://设置指定样式，参数1为样式名，参数2为样式内容
                var args = arguments;
                this.elements.forEach(function(e){
                    thinjs_setStyle(e, args[0], args[1]);
                });
                return this;
                break;
            default:
                ThinJS.error("function style(): The num of paras should be less than 3.");
                break;
        }
    }
    
    /**
     * 显示被选元素。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").show();
     */
    show(){
        this.elements.forEach(function(e){
            thinjs_setStyle(e, "display", "");
        });
        return this;
    }
    
    /**
     * 隐藏被选元素。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").hide();
     */
    hide(){
        this.elements.forEach(function(e){
            thinjs_setStyle(e, "display", "none");
        });
        return this;
    }
    
    /**
     * 切换显示或隐藏被选元素。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").toggle();
     */
    toggle(){
        this.elements.forEach(function(e){
            thinjs_setStyle(e, "display", thinjs_get(e)["display"]==="none"?"":"none");
        });
        return this;
    }
    
    /**
     * 被选元素设置一个或多个指定的属性。
     * @param {array} attr 必须，属性键值对数组。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").addAttr([{"id":"#myDiv"}, {"class":"active"}]);
     */
    addAttr(){//设置指定的属性
        if(!arguments[0])ThinJS.error("function addAttr(): Paras should not empty.");
        this.attr(...arguments);
        return this;
    }
    
    /**
     * 被选元素移除一个或多个指定的属性。
     * @param {array|string} attr 必须，属性名|属性名数组。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").removeAttr("class");
     * @example
     * thinjs("div").removeAttr(["id" ,"click"]);
     */
    removeAttr(){//移除指定的属性
        if(!arguments[0])ThinJS.error("function removeAttr(): Paras should not empty.");
        var args = arguments;
        if(args[0] instanceof Array){
            this.elements.forEach(function(e){
                for(var i = 0, len = args[0].length; i < len; i++){
                    e.attributes.removeNamedItem((args[0])[i]);
                }
            });
        }else if(typeof args[0] === "string"){
            this.elements.forEach(function(e){
                e.attributes.removeNamedItem(args[0]);
            });
        }else{
            ThinJS.error("function removeAttr(): The type of paras not meet the requirements.");
        }
        return this;
    }
    
    /**
     * 判断被选元素是否拥有指定的属性。
     * @param {string|array} attr 必须，属性名称|属性名称数组。
     * @return {boolean|array} 被选对象是否拥有指定的属性。
     * @example
     * thinjs("div").hasAttr("class");
     * @example
     * thinjs("div").hasAttr(["id", "click"]);
     */
    hasAttr(){//判断拥有指定的属性
        if(!arguments[0])ThinJS.error("function hasAttr(): Paras should not empty.");
        var args = arguments;
        if(typeof args[0] === "string"){
            if(this.elements.length === 1){
                return this.elements[0].attributes.getNamedItem(arguments[0]) ? true: false;
            }else if(this.elements.length > 1){
                var ret = [];
                this.elements.forEach(function(e){
                    ret.push(e.attributes.getNamedItem(args[0]) ? true: false);
                });
                return ret;
            }
            return null;
        }else if(args[0] instanceof Array){
            var ret = [];
            this.elements.forEach(function(e){
                var res = {};
                for(var i = 0, len = args[0].length; i < len; i++){
                    res[(args[0])[i]] = e.attributes.getNamedItem((args[0])[i]) ? true: false;
                }
                ret.push(res);
            });
            return ret;
        }
    }
    
    /**
     * 被选对象获取或设置属性。
     * @param {string|array|object} [attrName] 可选，属性名|属性名数组|属性键值对数组|属性键值对对象。
     * @param {string} [attrValue] 可选，属性值。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").attr();
     * @example
     * thinjs("div").attr("id");
     * @example
     * thinjs("div").attr(["id", "class"]);
     * @example
     * thinjs("div").attr([{"id":"myDiv"}, {"class":"active"}]);
     * @example
     * thinjs("div").attr({"id":"myDiv", "class":"active"});
     * @example
     * thinjs("div").attr("id", "myDiv");
     */
    attr(){//获取或者设置attr
        var args = arguments;
        switch(args.length){
            case 0://获取所有存在的属性
                if(this.elements.length === 1){
                    return this.elements[0].attributes;
                }else if(this.elements.length > 1){
                    var ret = [];
                    for(var i = 0, len = this.elements.length; i < len; i++){
                        ret.push(this.elements[i].attributes);
                    }
                    return ret;
                }
                return null;
                break;
            case 1://通过字符串"attrName"、数组["attrName1", "attrName2"]等形式获取属性，或者通过数组[{"attrName1": "attrVal1"}, {"attrName2": "attrVal2"}]、对象{"attrName1": "attrVal1", "attrName2": "attrVal2"}等形式设置属性
                if(typeof args[0] === "string"){//通过字符串形式获取属性
                    if(this.elements.length === 1){
                        return this.elements[0].attributes.getNamedItem(args[0]) ? this.elements[0].attributes.getNamedItem(args[0]).textContent : undefined;
                    }else if(this.elements.length > 1){
                        var ret = [];
                        for(var i = 0, len = this.elements.length; i < len; i++){
                            ret.push(this.elements[i].attributes.getNamedItem(args[0]) ? this.elements[i].attributes.getNamedItem(args[0]).textContent : undefined);
                        }
                        return ret;
                    }
                    return null;
                }else if(args[0] instanceof Array){//通过数组的形式获取或设置属性
                    var arr = args[0];
                    if(typeof arr[0] === "string"){//通过数组的形式获取属性
                        if(this.elements.length === 1){
                            var ret = {};
                            for(var i = 0, len = arr.length; i < len; i++){
                                ret[arr[i]] = this.elements[0].attributes.getNamedItem(arr[i]) ? this.elements[0].attributes.getNamedItem(arr[i]).textContent : undefined;
                            }
                            return ret;
                        }else if(this.elements.length > 1){
                            var ret = [];
                            for(var i = 0, len = this.elements.length; i < len; i++){
                                var res = {};
                                for(var j = 0, len = arr.length; j < len; j++){
                                    res[arr[j]] = this.elements[i].attributes.getNamedItem(arr[j]) ? this.elements[i].attributes.getNamedItem(arr[j]).textContent : undefined;
                                }
                                ret.push(res);
                            }
                            return ret;
                        }
                            return null;
                    }else{//通过数组的形式设置属性
                        this.elements.forEach(function(e){
                            for(var i = 0, len = arr.length; i < len; i++){
                                var attr = document.createAttribute(Object.keys(arr[i])[0]);
                                attr.nodeValue = Object.values(arr[i])[0];
                                e.attributes.setNamedItem(attr);
                            }
                        });
                        return this;
                    }
                }else{//通过对象的形式设置属性
                    var keys = Object.keys(arguments[0]);
                    var values = Object.values(arguments[0]);
                    for(var i = 0, len = keys.length; i < len; i++){
                        this.elements.forEach(function(e){
                            var attr = document.createAttribute(keys[i]);
                            attr.nodeValue = values[i];
                            e.attributes.setNamedItem(attr);
                        });
                    }
                    return this;
                }
                break;
            case 2://通过参数设置属性
                var args = arguments;
                this.elements.forEach(function(e){
                    var attr = document.createAttribute(args[0]);
                    attr.nodeValue = args[1];
                    e.attributes.setNamedItem(attr);
                });
                return this;
                break;
            default:
                ThinJS.error("function attr(): The num of paras should be less than 3.");
                break;
        }
    }
    
    /**
     * 在匹配元素上存储任意相关数据，或者查询相关数据。
     * @param {string|array|object} [name] 可选，用户存储数据的名称|以键值对的形式存储数据。
     * @param {string} [value] 可选，用户存储数据的内容或值。
     * @return {mixed} ThinJS对象。
     * @example
     * thinjs("div").data();
     * @example
     * thinjs("div").data("set");
     * @example
     * thinjs("div").data({"set":"set value", "config": "config value"});
     * @example
     * thinjs("div").data("set", "set value");
     */
    data(name, value){
        switch(arguments.length){
            case 0://以对象的形式从元素中返回所有存储的数据
                if(this.elements.length === 1){
                    var ret = {};
                    for(var i = 0, len = this.elements[0].attributes.length; i < len; i++){
                        var item = this.elements[0].attributes[i];
                        if(item.name.indexOf("data-")===0){
                            ret[item.name.replace("data-","")] = item.value;
                        }
                    }
                    return ret;
                }else if(this.elements.length > 1){
                    var ret = [];
                    for(var i = 0, len = this.elements.length; i < len; i++){
                        var res = {};
                        for(var j = 0, leng = this.elements[i].attributes.length; j < leng; j++){
                            var item = this.elements[i].attributes[j];
                            if(item.name.indexOf("data-")===0){
                                res[item.name.replace("data-","")] = item.value;
                            }
                        }
                        ret.push(res);
                    }
                    return ret;
                }
                return null;
                break;
            case 1://返回指定的附加的数据，使用带有名称/值对的对象向被选元素添加数据
                if(typeof name === "string"){//返回指定的附加的数据
                    if(this.elements.length === 1){
                        return this.elements[0].attributes.getNamedItem("data-" + name) ? this.elements[0].attributes.getNamedItem("data-" + name).textContent : undefined;
                    }else if(this.elements.length > 1){
                        var ret = [];
                        for(var i = 0, len = this.elements.length; i < len; i++){
                            ret.push(this.elements[i].attributes.getNamedItem("data-" + name) ? this.elements[i].attributes.getNamedItem("data-" + name).textContent : undefined);
                        }
                    }
                }else if(name instanceof Array){
                    ThinJS.error("function data(): The type of paras not meet the requirements.");
                }else{//使用带有键值对的对象向被选元素添加数据
                    var keys = Object.keys(name);
                    var values = Object.values(name);
                    for(var i = 0, len = keys.len; i < len; i++){
                        for(var j = 0, lens = this.elements.length; j < lens; j++){
                            var attr = document.createAttribute("data-" + keys[i]);
                            attr.nodeValue = values[i];
                            this.elements[j].attributes.setNamedItem(attr);
                        }
                    }
                    return this;
                }
                return null;
                break;
            case 2://向被选元素附加数据
                for(var i = 0, len = this.elements.length; i < len; i++){
                    var attr=document.createAttribute("data-" + name);
                    attr.nodeValue=value;
                    this.elements[i].attributes.setNamedItem(attr);
                }
                return this;
                break;
            default:
                ThinJS.error("function data(): The num of paras should be less than 3.");
                break;
        }
        return this;
    }
    
    /**
     * AJAX类实例调用方法。
     * @param {Object} settings AJAX请求的参数。
     * @param {string} settings.url 必须，AJAX请求的方式。
     * @param {string} [settings.type="GET"] 可选，AJAX请求的地址。
     * @param {boolean} [settings.async=true] 可选，此AJAX请求为异步请求。
     * @param {Object|string} [settings.data] 可选，发送到服务器的数据。
     * @param {string} [settings.contentType="application/x-www-form-urlencoded;charset=UTF-8"] 可选，发送到服务器的数据编码类型。
     * @param {string} [settings.dataType="text"] 可选，预期服务器返回的数据类型。
     * @param {integer} [settings.timeout=0] 可选，AJAX请求的超时时间。
     * @param {function} [settings.beforeSend] 可选，请求发送前的回调函数。
     * @param {function} [settings.success] 可选，请求成功后的回调函数。
     * @param {function} [settings.error] 可选，请求失败时调用此函数。
     * @param {string} [settings.username] 可选，用于响应HTTP访问认证请求的用户名。
     * @param {string} [settings.password] 可选，用于响应HTTP访问认证请求的用户密码。
     * @return {AJAX} AJAX对象。
     * @example
     * thinjs("div").ajax({    
     *     url: "localhost/data.json"
     *     type: "POST",
     *     data: {
     *         name: "user"
     *     },
     *     success: function(data){
     *     },
     *     error: function(){
     *     }
     * });
     */
    ajax(settings){
        /**
         * AJAX类
         * @class AJAX
         * @classdesc AJAX类
         */
        class AJAX{
            /**
             * AJAX构造函数。
             * @constructor AJAX
             * @param {Object} settings 必须，AJAX请求的参数。
             * @param {string} settings.url 必须，AJAX请求的方式。
             * @param {string} [settings.type="GET"] 可选，AJAX请求的地址。
             * @param {boolean} [settings.async=true] 可选，此AJAX请求为异步请求。
             * @param {Object|string} [settings.data] 可选，发送到服务器的数据。
             * @param {string} [settings.contentType="application/x-www-form-urlencoded;charset=UTF-8"] 可选，发送到服务器的数据编码类型。
             * @param {string} [settings.dataType="text"] 可选，预期服务器返回的数据类型。
             * @param {integer} [settings.timeout=0] 可选，AJAX请求的超时时间。
             * @param {function} [settings.beforeSend] 可选，请求发送前的回调函数。
             * @param {function} [settings.success] 可选，请求成功后的回调函数。
             * @param {function} [settings.error] 可选，请求失败时调用此函数。
             * @param {string} [settings.username] 可选，用于响应HTTP访问认证请求的用户名。
             * @param {string} [settings.password] 可选，用于响应HTTP访问认证请求的用户密码。
             * @return {AJAX} AJAX对象。
             */
            constructor(settings){
                //获取ajax的相应值（请求类型，请求地址，同步或异步，传递数据，接收数据类型，成功失败函数等）
                var ajaxData = {
                    type: arguments[0].type ? (arguments[0].type).toUpperCase() : "GET",
                    url: arguments[0].url || "",
                    async: !!arguments[0].async || true,
                    data: arguments[0].data || null,
                    dataType: arguments[0].dataType || "text",
                    contentType: arguments[0].contentType || "application/x-www-form-urlencoded;charset=UTF-8",
                    timeout: parseInt(arguments[0].timeout) || 0,
                    beforeSend: arguments[0].beforeSend || function(){},
                    success: arguments[0].success || function(){},
                    error: arguments[0].error || function(){},
                    username: arguments[0].username || "",
                    password: arguments[0].password || ""
                };
                ajaxData.beforeSend();
                var xhr = thinjs_createxmlHttpRequest();//创建 XMLHttpRequest 对象
                xhr.timeout = ajaxData.timeout;//设置超时时间。默认为0，即没有超时
                xhr.responseType = ajaxData.dataType;//预期服务器返回的数据类型
                if(ajaxData.username && ajaxData.password){
                    xhr.open(ajaxData.type, ajaxData.url, ajaxData.async, ajaxData.username, ajaxData.password);//附带认证信息
                }else{
                    xhr.open(ajaxData.type, ajaxData.url, ajaxData.async);//规定请求的类型、URL 以及是否异步处理请求
                }
                xhr.setRequestHeader("Content-Type", ajaxData.contentType);//发送信息至服务器时内容编码类型(向请求添加 HTTP 头)
                xhr.send(thinjs_convertData(ajaxData.data));//将请求发送到服务器
                //当请求被发送到服务器时，我们需要执行一些基于响应的任务。
                //每当 readyState 改变时，就会触发 onreadystatechange 事件。
                //readyState 属性存有 XMLHttpRequest 的状态信息。
                xhr.onreadystatechange = function(){
                    if (xhr.readyState === 4){
                        if(xhr.status === 200){
                            ajaxData.success(xhr.response);
                        }else{
                            ajaxData.error();
                        }
                    }
                };
                this.ajax = xhr;
            }

            /**
             * AJAX类的实例化方法。
             * @param {Object} settings 必须，AJAX请求的参数。
             * @param {string} settings.url 必须，AJAX请求的方式。
             * @param {string} [settings.type="GET"] 可选，AJAX请求的地址。
             * @param {boolean} [settings.async=true] 可选，此AJAX请求为异步请求。
             * @param {Object|string} [settings.data] 可选，发送到服务器的数据。
             * @param {string} [settings.contentType="application/x-www-form-urlencoded;charset=UTF-8"] 可选，发送到服务器的数据编码类型。
             * @param {string} [settings.dataType="text"] 可选，预期服务器返回的数据类型。
             * @param {integer} [settings.timeout=0] 可选，AJAX请求的超时时间。
             * @param {function} [settings.beforeSend] 可选，请求发送前的回调函数。
             * @param {function} [settings.success] 可选，请求成功后的回调函数。
             * @param {function} [settings.error] 可选，请求失败时调用此函数。
             * @param {string} [settings.username] 可选，用于响应HTTP访问认证请求的用户名。
             * @param {string} [settings.password] 可选，用于响应HTTP访问认证请求的用户密码。
             * @return {AJAX} AJAX对象。
             */
            static main(settings){
                let ajax = new AJAX(settings);
                ajax.prototype = AJAX.prototype;
                return ajax;
            }

            /**
             * 向AJAX添加一个或多个事件处理程序。
             * @param {string} event 必须，事件名称，多个之间用空格隔开。
             * @param {function} callback 必须，当事件发生时运行的函数。
             * @return {mixed} ThinJS对象。
             */
            on(event, callback){
                var that = this.ajax;
                var events = event.trim();
                events = events.split(" ");
                events.forEach(function(e){
                    that.addEventListener(e, callback);
                });
                return this;
            }
        }

        /**
         * 调用AJAX类的实例化方法。
         * @param {Object} settings 必须，AJAX请求的参数。
         * @return {AJAX} AJAX对象。
         */
         return AJAX.main(settings);
    }
}

/**
 * 调用ThinJS类的实例化方法。
 * @param {string|Array|NodeList|HTMLDocument|Window|Object} selector 必须，元素选择器。
 * @param {Object} [data] 可选，定义模板数据对象。
 * @return {ThinJS} ThinJS对象。
 * @example
 * thinjs("div");
 * @example
 * thinjs(document);
 * @example
 * thinjs();
 * @example
 * <ul id="myList">
 *     <% for(var i = 0; i < data.list.length; i++){ %>
 *     <li>
 *         <%= data.list[i] %>
 *     </li>
 * </ul>
 * <script type="text/javascript">
 *     thinjs("ul#myList", {
 *         list: [
 *             "banana",
 *             "apple",
 *             "orange"
 *         ];
 *     });
 * </script>
 */
var thinjs = function(selector,data){
    return ThinJS.main(selector,data);
};

thinjs.fn = thinjs.prototype = {
    /**
     * 获取匹配元素的数量。
     * @return {integer} 匹配元素的数量。
     */
    length: this.length
};

window.thinjs = thinjs;

/**
 * 编译模板，把模板中的javascript可执行语句编译成HTML内容。
 * @param {object|array} elements 要转换的指定元素
 * @param {array} templates 要转换的指定元素对应于模板内容
 * @param {object} data 模板数据
 */
function thinjs_template(elements,templates,data){
    elements.forEach((element,index)=>{
        let parse = eval(thinjs_compile(templates[index]));
        element.innerHTML = parse(data);
    });
}

/**
 * 解释模板，把模板中<%...%>转换为javascript可执行语句。
 * @param {string} template 必须，要转换的模板。
 * @return {mixed} 转换成的javascript指令。
 */
 function thinjs_compile(template){
    const evalExpr = /<%=(.+?)%>/g;
    const expr = /<%([\s\S]+?)%>/g;
    template = template
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/apos;/g, "'")
        .replace(/nbsp;/g, " ");
    template = template
        .replace(evalExpr, '`); \n  echo( $1 ); \n  echo(`')
        .replace(expr, '`); \n $1 \n  echo(`');
    template = 'echo(`' + template + '`);';
    let script =`
        (function parse(data){
            var output = "";
            function echo(html){
            output += html;
            }
            ${ template }
            return output;
        })
    `;
    return script;
}
    
function thinjs_getStyle(node){//获取指定元素的应用样式
	var ret = {};
	var arr = node.currentStyle ? node.currentStyle : getComputedStyle(node);
	var keys = Object.keys(arr);
	for(var i = 0, len = keys.length; i < len; i++){
            if(isNaN(parseInt(keys[i]))){
                ret[thinjs_css_obj2str(keys[i].toString())]=arr[keys[i]];
            }
	}
	return ret;
}

function thinjs_setStyle(node, styleName, styleContent){//对指定元素设置指定的具体样式
    node.style[thinjs_css_str2obj(styleName.toString())] = styleContent;
}

function thinjs_css_str2obj(str){//Ex: border-top-width => borderTopWidth
    return str.replace(/-([a-z])/g, function(e){
        return e.toUpperCase().replace("-", "");
    });
}

function thinjs_css_obj2str(obj){//Ex: borderTopWidth => border-top-width
    return obj.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function thinjs_createxmlHttpRequest(){//创建 XMLHttpRequest 对象
    if(window.ActiveXObject){
        // IE6, IE5 浏览器执行代码
        return new ActiveXObject("Microsoft.XMLHTTP");
    }else if(window.XMLHttpRequest){
        //IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
        return new XMLHttpRequest();
    }
}

function thinjs_convertData(data) {//解析传入的对象
    if (typeof data === "object") {
        var convertResult = "";
        for (var c in data) {
            convertResult += c + "=" + data[c] + "&";
        }
        convertResult = convertResult.substring(0, convertResult.length - 1);
        return convertResult;
    } else {
        return data;
    }
}

/**
 * 把传入的对象或数组转换成字符串，类似于toSource功能。
 * @param {mixed} str 必须，要转换成字符串的对象或数组。
 * @return {string} 转换结果。
 */
function thinjs_parseString(str){
    var ret = "";
    if(str instanceof Array){//如果传进来的是数组
    ret += "[";
    for(var i=0;i<str.length;i++){
        if(typeof str[i] === "object"){//如果对应的内容是object，则继续解析
            ret += thinjs_parseString(str[i]);
        }else{
            ret += (typeof str[i] === "string" ? ("\"" + str[i] + "\"") : str[i]);//如果值是字符串类型，则需要添加双引号
        }
        if((i+1) < str.length){//等同于Array.join(", ")
            ret += ", ";
        }
    }
    ret += "]";
    }else if(str instanceof Object){//如果传进来的是Object
    ret += "{";
    for(var i = 0, keys = Object.keys(str), values = Object.values(str); i < values.length; i++){
        if(typeof values[i] === "object"){
            ret += keys[i] + ": " + thinjs_parseString(values[i]);//跟Array的一样
        }else{
            ret += keys[i] + ": " + (typeof values[i] === "string" ? ("\"" + values[i] + "\"") : values[i]);//同等
        }
        if((i+1) < values.length){
            ret += ", ";
        }
    }
    ret += "}";
    }else{//不是Array或Object则直接显示
        ret += (typeof str === "string" ? ("\"" + str + "\"") : str);
    }
    return ret;
}

})(window);