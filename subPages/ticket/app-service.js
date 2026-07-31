/*v0.5vv_20211229_syb_scopedata*/
global.__wcc_version__ = 'v0.5vv_20211229_syb_scopedata';
global.__wcc_version_info__ = {
    "customComponents": true,
    "fixZeroRpx": true,
    "propValueDeepCopy": false
};
var $gwxc
var $gaic = {}
$gwx0 = function(path, global) {
    if (typeof global === 'undefined') global = {};
    if (typeof __WXML_GLOBAL__ === 'undefined') {
        __WXML_GLOBAL__ = {};
    }
    __WXML_GLOBAL__.modules = __WXML_GLOBAL__.modules || {};
    $gwx('init', global);

    function _(a, b) {
        if (typeof(b) != 'undefined') a.children.push(b);
    }

    function _v(k) {
        if (typeof(k) != 'undefined') return {
            tag: 'virtual',
            'wxKey': k,
            children: []
        };
        return {
            tag: 'virtual',
            children: []
        };
    }

    function _n(tag) {
        return {
            tag: 'wx-' + tag,
            attr: {},
            children: [],
            n: [],
            raw: {},
            generics: {}
        }
    }

    function _p(a, b) {
        b && a.properities.push(b);
    }

    function _s(scope, env, key) {
        return typeof(scope[key]) != 'undefined' ? scope[key] : env[key]
    }

    function _wp(m) {
        console.warn("WXMLRT_$gwx0:" + m)
    }

    function _wl(tname, prefix) {
        _wp(prefix + ':-1:-1:-1: Template `' + tname + '` is being called recursively, will be stop.')
    }
    $gwn = console.warn;
    $gwl = console.log;

    function $gwh() {
        function x() {}
        x.prototype = {
            hn: function(obj, all) {
                if (typeof(obj) == 'object') {
                    var cnt = 0;
                    var any1 = false,
                        any2 = false;
                    for (var x in obj) {
                        any1 = any1 | x === '__value__';
                        any2 = any2 | x === '__wxspec__';
                        cnt++;
                        if (cnt > 2) break;
                    }
                    return cnt == 2 && any1 && any2 && (all || obj.__wxspec__ !== 'm' || this.hn(obj.__value__) === 'h') ? "h" : "n";
                }
                return "n";
            },
            nh: function(obj, special) {
                return {
                    __value__: obj,
                    __wxspec__: special ? special : true
                }
            },
            rv: function(obj) {
                return this.hn(obj, true) === 'n' ? obj : this.rv(obj.__value__);
            },
            hm: function(obj) {
                if (typeof(obj) == 'object') {
                    var cnt = 0;
                    var any1 = false,
                        any2 = false;
                    for (var x in obj) {
                        any1 = any1 | x === '__value__';
                        any2 = any2 | x === '__wxspec__';
                        cnt++;
                        if (cnt > 2) break;
                    }
                    return cnt == 2 && any1 && any2 && (obj.__wxspec__ === 'm' || this.hm(obj.__value__));
                }
                return false;
            }
        }
        return new x;
    }
    wh = $gwh();

    function $gstack(s) {
        var tmp = s.split('\n ' + ' ' + ' ' + ' ');
        for (var i = 0; i < tmp.length; ++i) {
            if (0 == i) continue;
            if (")" === tmp[i][tmp[i].length - 1])
                tmp[i] = tmp[i].replace(/\s\(.*\)$/, "");
            else
                tmp[i] = "at anonymous function";
        }
        return tmp.join('\n ' + ' ' + ' ' + ' ');
    }

    function $gwrt(should_pass_type_info) {
        function ArithmeticEv(ops, e, s, g, o) {
            var _f = false;
            var rop = ops[0][1];
            var _a, _b, _c, _d, _aa, _bb;
            switch (rop) {
                case '?:':
                    _a = rev(ops[1], e, s, g, o, _f);
                    _c = should_pass_type_info && (wh.hn(_a) === 'h');
                    _d = wh.rv(_a) ? rev(ops[2], e, s, g, o, _f) : rev(ops[3], e, s, g, o, _f);
                    _d = _c && wh.hn(_d) === 'n' ? wh.nh(_d, 'c') : _d;
                    return _d;
                    break;
                case '&&':
                    _a = rev(ops[1], e, s, g, o, _f);
                    _c = should_pass_type_info && (wh.hn(_a) === 'h');
                    _d = wh.rv(_a) ? rev(ops[2], e, s, g, o, _f) : wh.rv(_a);
                    _d = _c && wh.hn(_d) === 'n' ? wh.nh(_d, 'c') : _d;
                    return _d;
                    break;
                case '||':
                    _a = rev(ops[1], e, s, g, o, _f);
                    _c = should_pass_type_info && (wh.hn(_a) === 'h');
                    _d = wh.rv(_a) ? wh.rv(_a) : rev(ops[2], e, s, g, o, _f);
                    _d = _c && wh.hn(_d) === 'n' ? wh.nh(_d, 'c') : _d;
                    return _d;
                    break;
                case '+':
                case '*':
                case '/':
                case '%':
                case '|':
                case '^':
                case '&':
                case '===':
                case '==':
                case '!=':
                case '!==':
                case '>=':
                case '<=':
                case '>':
                case '<':
                case '<<':
                case '>>':
                    _a = rev(ops[1], e, s, g, o, _f);
                    _b = rev(ops[2], e, s, g, o, _f);
                    _c = should_pass_type_info && (wh.hn(_a) === 'h' || wh.hn(_b) === 'h');
                    switch (rop) {
                        case '+':
                            _d = wh.rv(_a) + wh.rv(_b);
                            break;
                        case '*':
                            _d = wh.rv(_a) * wh.rv(_b);
                            break;
                        case '/':
                            _d = wh.rv(_a) / wh.rv(_b);
                            break;
                        case '%':
                            _d = wh.rv(_a) % wh.rv(_b);
                            break;
                        case '|':
                            _d = wh.rv(_a) | wh.rv(_b);
                            break;
                        case '^':
                            _d = wh.rv(_a) ^ wh.rv(_b);
                            break;
                        case '&':
                            _d = wh.rv(_a) & wh.rv(_b);
                            break;
                        case '===':
                            _d = wh.rv(_a) === wh.rv(_b);
                            break;
                        case '==':
                            _d = wh.rv(_a) == wh.rv(_b);
                            break;
                        case '!=':
                            _d = wh.rv(_a) != wh.rv(_b);
                            break;
                        case '!==':
                            _d = wh.rv(_a) !== wh.rv(_b);
                            break;
                        case '>=':
                            _d = wh.rv(_a) >= wh.rv(_b);
                            break;
                        case '<=':
                            _d = wh.rv(_a) <= wh.rv(_b);
                            break;
                        case '>':
                            _d = wh.rv(_a) > wh.rv(_b);
                            break;
                        case '<':
                            _d = wh.rv(_a) < wh.rv(_b);
                            break;
                        case '<<':
                            _d = wh.rv(_a) << wh.rv(_b);
                            break;
                        case '>>':
                            _d = wh.rv(_a) >> wh.rv(_b);
                            break;
                        default:
                            break;
                    }
                    return _c ? wh.nh(_d, "c") : _d;
                    break;
                case '-':
                    _a = ops.length === 3 ? rev(ops[1], e, s, g, o, _f) : 0;
                    _b = ops.length === 3 ? rev(ops[2], e, s, g, o, _f) : rev(ops[1], e, s, g, o, _f);
                    _c = should_pass_type_info && (wh.hn(_a) === 'h' || wh.hn(_b) === 'h');
                    _d = _c ? wh.rv(_a) - wh.rv(_b) : _a - _b;
                    return _c ? wh.nh(_d, "c") : _d;
                    break;
                case '!':
                    _a = rev(ops[1], e, s, g, o, _f);
                    _c = should_pass_type_info && (wh.hn(_a) == 'h');
                    _d = !wh.rv(_a);
                    return _c ? wh.nh(_d, "c") : _d;
                case '~':
                    _a = rev(ops[1], e, s, g, o, _f);
                    _c = should_pass_type_info && (wh.hn(_a) == 'h');
                    _d = ~wh.rv(_a);
                    return _c ? wh.nh(_d, "c") : _d;
                default:
                    $gwn('unrecognized op' + rop);
            }
        }

        function rev(ops, e, s, g, o, newap) {
            var op = ops[0];
            var _f = false;
            if (typeof newap !== "undefined") o.ap = newap;
            if (typeof(op) === 'object') {
                var vop = op[0];
                var _a, _aa, _b, _bb, _c, _d, _s, _e, _ta, _tb, _td;
                switch (vop) {
                    case 2:
                        return ArithmeticEv(ops, e, s, g, o);
                        break;
                    case 4:
                        return rev(ops[1], e, s, g, o, _f);
                        break;
                    case 5:
                        switch (ops.length) {
                            case 2:
                                _a = rev(ops[1], e, s, g, o, _f);
                                return should_pass_type_info ? [_a] : [wh.rv(_a)];
                                return [_a];
                                break;
                            case 1:
                                return [];
                                break;
                            default:
                                _a = rev(ops[1], e, s, g, o, _f);
                                _b = rev(ops[2], e, s, g, o, _f);
                                _a.push(
                                    should_pass_type_info ?
                                    _b :
                                    wh.rv(_b)
                                );
                                return _a;
                                break;
                        }
                        break;
                    case 6:
                        _a = rev(ops[1], e, s, g, o);
                        var ap = o.ap;
                        _ta = wh.hn(_a) === 'h';
                        _aa = _ta ? wh.rv(_a) : _a;
                        o.is_affected |= _ta;
                        if (should_pass_type_info) {
                            if (_aa === null || typeof(_aa) === 'undefined') {
                                return _ta ? wh.nh(undefined, 'e') : undefined;
                            }
                            _b = rev(ops[2], e, s, g, o, _f);
                            _tb = wh.hn(_b) === 'h';
                            _bb = _tb ? wh.rv(_b) : _b;
                            o.ap = ap;
                            o.is_affected |= _tb;
                            if (_bb === null || typeof(_bb) === 'undefined' ||
                                _bb === "__proto__" || _bb === "prototype" || _bb === "caller") {
                                return (_ta || _tb) ? wh.nh(undefined, 'e') : undefined;
                            }
                            _d = _aa[_bb];
                            if (typeof _d === 'function' && !ap) _d = undefined;
                            _td = wh.hn(_d) === 'h';
                            o.is_affected |= _td;
                            return (_ta || _tb) ? (_td ? _d : wh.nh(_d, 'e')) : _d;
                        } else {
                            if (_aa === null || typeof(_aa) === 'undefined') {
                                return undefined;
                            }
                            _b = rev(ops[2], e, s, g, o, _f);
                            _tb = wh.hn(_b) === 'h';
                            _bb = _tb ? wh.rv(_b) : _b;
                            o.ap = ap;
                            o.is_affected |= _tb;
                            if (_bb === null || typeof(_bb) === 'undefined' ||
                                _bb === "__proto__" || _bb === "prototype" || _bb === "caller") {
                                return undefined;
                            }
                            _d = _aa[_bb];
                            if (typeof _d === 'function' && !ap) _d = undefined;
                            _td = wh.hn(_d) === 'h';
                            o.is_affected |= _td;
                            return _td ? wh.rv(_d) : _d;
                        }
                    case 7:
                        switch (ops[1][0]) {
                            case 11:
                                o.is_affected |= wh.hn(g) === 'h';
                                return g;
                            case 3:
                                _s = wh.rv(s);
                                _e = wh.rv(e);
                                _b = ops[1][1];
                                if (g && g.f && g.f.hasOwnProperty(_b)) {
                                    _a = g.f;
                                    o.ap = true;
                                } else {
                                    _a = _s && _s.hasOwnProperty(_b) ?
                                        s : (_e && _e.hasOwnProperty(_b) ? e : undefined);
                                }
                                if (should_pass_type_info) {
                                    if (_a) {
                                        _ta = wh.hn(_a) === 'h';
                                        _aa = _ta ? wh.rv(_a) : _a;
                                        _d = _aa[_b];
                                        _td = wh.hn(_d) === 'h';
                                        o.is_affected |= _ta || _td;
                                        _d = _ta && !_td ? wh.nh(_d, 'e') : _d;
                                        return _d;
                                    }
                                } else {
                                    if (_a) {
                                        _ta = wh.hn(_a) === 'h';
                                        _aa = _ta ? wh.rv(_a) : _a;
                                        _d = _aa[_b];
                                        _td = wh.hn(_d) === 'h';
                                        o.is_affected |= _ta || _td;
                                        return wh.rv(_d);
                                    }
                                }
                                return undefined;
                        }
                        break;
                    case 8:
                        _a = {};
                        _a[ops[1]] = rev(ops[2], e, s, g, o, _f);
                        return _a;
                        break;
                    case 9:
                        _a = rev(ops[1], e, s, g, o, _f);
                        _b = rev(ops[2], e, s, g, o, _f);

                        function merge(_a, _b, _ow) {
                            var ka, _bbk;
                            _ta = wh.hn(_a) === 'h';
                            _tb = wh.hn(_b) === 'h';
                            _aa = wh.rv(_a);
                            _bb = wh.rv(_b);
                            for (var k in _bb) {
                                if (_ow || !_aa.hasOwnProperty(k)) {
                                    _aa[k] = should_pass_type_info ? (_tb ? wh.nh(_bb[k], 'e') : _bb[k]) : wh.rv(_bb[k]);
                                }
                            }
                            return _a;
                        }
                        var _c = _a
                        var _ow = true
                        if (typeof(ops[1][0]) === "object" && ops[1][0][0] === 10) {
                            _a = _b
                            _b = _c
                            _ow = false
                        }
                        if (typeof(ops[1][0]) === "object" && ops[1][0][0] === 10) {
                            var _r = {}
                            return merge(merge(_r, _a, _ow), _b, _ow);
                        } else
                            return merge(_a, _b, _ow);
                        break;
                    case 10:
                        _a = rev(ops[1], e, s, g, o, _f);
                        _a = should_pass_type_info ? _a : wh.rv(_a);
                        return _a;
                        break;
                    case 12:
                        var _r;
                        _a = rev(ops[1], e, s, g, o);
                        if (!o.ap) {
                            return should_pass_type_info && wh.hn(_a) === 'h' ? wh.nh(_r, 'f') : _r;
                        }
                        var ap = o.ap;
                        _b = rev(ops[2], e, s, g, o, _f);
                        o.ap = ap;
                        _ta = wh.hn(_a) === 'h';
                        _tb = _ca(_b);
                        _aa = wh.rv(_a);
                        _bb = wh.rv(_b);
                        snap_bb = $gdc(_bb, "nv_");
                        try {
                            _r = typeof _aa === "function" ? $gdc(_aa.apply(null, snap_bb)) : undefined;
                        } catch (e) {
                            e.message = e.message.replace(/nv_/g, "");
                            e.stack = e.stack.substring(0, e.stack.indexOf("\n", e.stack.lastIndexOf("at nv_")));
                            e.stack = e.stack.replace(/\snv_/g, " ");
                            e.stack = $gstack(e.stack);
                            if (g.debugInfo) {
                                e.stack += "\n " + " " + " " + " at " + g.debugInfo[0] + ":" + g.debugInfo[1] + ":" + g.debugInfo[2];
                                console.error(e);
                            }
                            _r = undefined;
                        }
                        return should_pass_type_info && (_tb || _ta) ? wh.nh(_r, 'f') : _r;
                }
            } else {
                if (op === 3 || op === 1) return ops[1];
                else if (op === 11) {
                    var _a = '';
                    for (var i = 1; i < ops.length; i++) {
                        var xp = wh.rv(rev(ops[i], e, s, g, o, _f));
                        _a += typeof(xp) === 'undefined' ? '' : xp;
                    }
                    return _a;
                }
            }
        }

        function wrapper(ops, e, s, g, o, newap) {
            if (ops[0] == '11182016') {
                g.debugInfo = ops[2];
                return rev(ops[1], e, s, g, o, newap);
            } else {
                g.debugInfo = null;
                return rev(ops, e, s, g, o, newap);
            }
        }
        return wrapper;
    }
    gra = $gwrt(true);
    grb = $gwrt(false);

    function TestTest(expr, ops, e, s, g, expect_a, expect_b, expect_affected) {
        {
            var o = {
                is_affected: false
            };
            var a = gra(ops, e, s, g, o);
            if (JSON.stringify(a) != JSON.stringify(expect_a) || o.is_affected != expect_affected) {
                console.warn("A. " + expr + " get result " + JSON.stringify(a) + ", " + o.is_affected + ", but " + JSON.stringify(expect_a) + ", " + expect_affected + " is expected");
            }
        } {
            var o = {
                is_affected: false
            };
            var a = grb(ops, e, s, g, o);
            if (JSON.stringify(a) != JSON.stringify(expect_b) || o.is_affected != expect_affected) {
                console.warn("B. " + expr + " get result " + JSON.stringify(a) + ", " + o.is_affected + ", but " + JSON.stringify(expect_b) + ", " + expect_affected + " is expected");
            }
        }
    }

    function wfor(to_iter, func, env, _s, global, father, itemname, indexname, keyname) {
        var _n = wh.hn(to_iter) === 'n';
        var scope = wh.rv(_s);
        var has_old_item = scope.hasOwnProperty(itemname);
        var has_old_index = scope.hasOwnProperty(indexname);
        var old_item = scope[itemname];
        var old_index = scope[indexname];
        var full = Object.prototype.toString.call(wh.rv(to_iter));
        var type = full[8];
        if (type === 'N' && full[10] === 'l') type = 'X';
        var _y;
        if (_n) {
            if (type === 'A') {
                var r_iter_item;
                for (var i = 0; i < to_iter.length; i++) {
                    scope[itemname] = to_iter[i];
                    scope[indexname] = _n ? i : wh.nh(i, 'h');
                    r_iter_item = wh.rv(to_iter[i]);
                    var key = keyname && r_iter_item ? (keyname === "*this" ? r_iter_item : wh.rv(r_iter_item[keyname])) : undefined;
                    _y = _v(key);
                    _(father, _y);
                    func(env, scope, _y, global);
                }
            } else if (type === 'O') {
                var i = 0;
                var r_iter_item;
                for (var k in to_iter) {
                    scope[itemname] = to_iter[k];
                    scope[indexname] = _n ? k : wh.nh(k, 'h');
                    r_iter_item = wh.rv(to_iter[k]);
                    var key = keyname && r_iter_item ? (keyname === "*this" ? r_iter_item : wh.rv(r_iter_item[keyname])) : undefined;
                    _y = _v(key);
                    _(father, _y);
                    func(env, scope, _y, global);
                    i++;
                }
            } else if (type === 'S') {
                for (var i = 0; i < to_iter.length; i++) {
                    scope[itemname] = to_iter[i];
                    scope[indexname] = _n ? i : wh.nh(i, 'h');
                    _y = _v(to_iter[i] + i);
                    _(father, _y);
                    func(env, scope, _y, global);
                }
            } else if (type === 'N') {
                for (var i = 0; i < to_iter; i++) {
                    scope[itemname] = i;
                    scope[indexname] = _n ? i : wh.nh(i, 'h');
                    _y = _v(i);
                    _(father, _y);
                    func(env, scope, _y, global);
                }
            } else {}
        } else {
            var r_to_iter = wh.rv(to_iter);
            var r_iter_item, iter_item;
            if (type === 'A') {
                for (var i = 0; i < r_to_iter.length; i++) {
                    iter_item = r_to_iter[i];
                    iter_item = wh.hn(iter_item) === 'n' ? wh.nh(iter_item, 'h') : iter_item;
                    r_iter_item = wh.rv(iter_item);
                    scope[itemname] = iter_item
                    scope[indexname] = _n ? i : wh.nh(i, 'h');
                    var key = keyname && r_iter_item ? (keyname === "*this" ? r_iter_item : wh.rv(r_iter_item[keyname])) : undefined;
                    _y = _v(key);
                    _(father, _y);
                    func(env, scope, _y, global);
                }
            } else if (type === 'O') {
                var i = 0;
                for (var k in r_to_iter) {
                    iter_item = r_to_iter[k];
                    iter_item = wh.hn(iter_item) === 'n' ? wh.nh(iter_item, 'h') : iter_item;
                    r_iter_item = wh.rv(iter_item);
                    scope[itemname] = iter_item;
                    scope[indexname] = _n ? k : wh.nh(k, 'h');
                    var key = keyname && r_iter_item ? (keyname === "*this" ? r_iter_item : wh.rv(r_iter_item[keyname])) : undefined;
                    _y = _v(key);
                    _(father, _y);
                    func(env, scope, _y, global);
                    i++
                }
            } else if (type === 'S') {
                for (var i = 0; i < r_to_iter.length; i++) {
                    iter_item = wh.nh(r_to_iter[i], 'h');
                    scope[itemname] = iter_item;
                    scope[indexname] = _n ? i : wh.nh(i, 'h');
                    _y = _v(to_iter[i] + i);
                    _(father, _y);
                    func(env, scope, _y, global);
                }
            } else if (type === 'N') {
                for (var i = 0; i < r_to_iter; i++) {
                    iter_item = wh.nh(i, 'h');
                    scope[itemname] = iter_item;
                    scope[indexname] = _n ? i : wh.nh(i, 'h');
                    _y = _v(i);
                    _(father, _y);
                    func(env, scope, _y, global);
                }
            } else {}
        }
        if (has_old_item) {
            scope[itemname] = old_item;
        } else {
            delete scope[itemname];
        }
        if (has_old_index) {
            scope[indexname] = old_index;
        } else {
            delete scope[indexname];
        }
    }

    function _ca(o) {
        if (wh.hn(o) == 'h') return true;
        if (typeof o !== "object") return false;
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                if (_ca(o[i])) return true;
            }
        }
        return false;
    }

    function _da(node, attrname, opindex, raw, o) {
        var isaffected = false;
        var value = $gdc(raw, "", 2);
        if (o.ap && value && value.constructor === Function) {
            attrname = "$wxs:" + attrname;
            node.attr["$gdc"] = $gdc;
        }
        if (o.is_affected || _ca(raw)) {
            node.n.push(attrname);
            node.raw[attrname] = raw;
        }
        node.attr[attrname] = value;
    }

    function _r(node, attrname, opindex, env, scope, global) {
        global.opindex = opindex;
        var o = {},
            _env;
        var a = grb(z[opindex], env, scope, global, o);
        _da(node, attrname, opindex, a, o);
    }

    function _rz(z, node, attrname, opindex, env, scope, global) {
        global.opindex = opindex;
        var o = {},
            _env;
        var a = grb(z[opindex], env, scope, global, o);
        _da(node, attrname, opindex, a, o);
    }

    function _o(opindex, env, scope, global) {
        global.opindex = opindex;
        var nothing = {};
        var r = grb(z[opindex], env, scope, global, nothing);
        return (r && r.constructor === Function) ? undefined : r;
    }

    function _oz(z, opindex, env, scope, global) {
        global.opindex = opindex;
        var nothing = {};
        var r = grb(z[opindex], env, scope, global, nothing);
        return (r && r.constructor === Function) ? undefined : r;
    }

    function _1(opindex, env, scope, global, o) {
        var o = o || {};
        global.opindex = opindex;
        return gra(z[opindex], env, scope, global, o);
    }

    function _1z(z, opindex, env, scope, global, o) {
        var o = o || {};
        global.opindex = opindex;
        return gra(z[opindex], env, scope, global, o);
    }

    function _2(opindex, func, env, scope, global, father, itemname, indexname, keyname) {
        var o = {};
        var to_iter = _1(opindex, env, scope, global);
        wfor(to_iter, func, env, scope, global, father, itemname, indexname, keyname);
    }

    function _2z(z, opindex, func, env, scope, global, father, itemname, indexname, keyname) {
        var o = {};
        var to_iter = _1z(z, opindex, env, scope, global);
        wfor(to_iter, func, env, scope, global, father, itemname, indexname, keyname);
    }


    function _m(tag, attrs, generics, env, scope, global) {
        var tmp = _n(tag);
        var base = 0;
        for (var i = 0; i < attrs.length; i += 2) {
            if (base + attrs[i + 1] < 0) {
                tmp.attr[attrs[i]] = true;
            } else {
                _r(tmp, attrs[i], base + attrs[i + 1], env, scope, global);
                if (base === 0) base = attrs[i + 1];
            }
        }
        for (var i = 0; i < generics.length; i += 2) {
            if (base + generics[i + 1] < 0) {
                tmp.generics[generics[i]] = "";
            } else {
                var $t = grb(z[base + generics[i + 1]], env, scope, global);
                if ($t != "") $t = "wx-" + $t;
                tmp.generics[generics[i]] = $t;
                if (base === 0) base = generics[i + 1];
            }
        }
        return tmp;
    }

    function _mz(z, tag, attrs, generics, env, scope, global) {
        var tmp = _n(tag);
        var base = 0;
        for (var i = 0; i < attrs.length; i += 2) {
            if (base + attrs[i + 1] < 0) {
                tmp.attr[attrs[i]] = true;
            } else {
                _rz(z, tmp, attrs[i], base + attrs[i + 1], env, scope, global);
                if (base === 0) base = attrs[i + 1];
            }
        }
        for (var i = 0; i < generics.length; i += 2) {
            if (base + generics[i + 1] < 0) {
                tmp.generics[generics[i]] = "";
            } else {
                var $t = grb(z[base + generics[i + 1]], env, scope, global);
                if ($t != "") $t = "wx-" + $t;
                tmp.generics[generics[i]] = $t;
                if (base === 0) base = generics[i + 1];
            }
        }
        return tmp;
    }

    var nf_init = function() {
        if (typeof __WXML_GLOBAL__ === "undefined" || undefined === __WXML_GLOBAL__.wxs_nf_init) {
            nf_init_Object();
            nf_init_Function();
            nf_init_Array();
            nf_init_String();
            nf_init_Boolean();
            nf_init_Number();
            nf_init_Math();
            nf_init_Date();
            nf_init_RegExp();
        }
        if (typeof __WXML_GLOBAL__ !== "undefined") __WXML_GLOBAL__.wxs_nf_init = true;
    };
    var nf_init_Object = function() {
        Object.defineProperty(Object.prototype, "nv_constructor", {
            writable: true,
            value: "Object"
        })
        Object.defineProperty(Object.prototype, "nv_toString", {
            writable: true,
            value: function() {
                return "[object Object]"
            }
        })
    }
    var nf_init_Function = function() {
        Object.defineProperty(Function.prototype, "nv_constructor", {
            writable: true,
            value: "Function"
        })
        Object.defineProperty(Function.prototype, "nv_length", {get: function() {
                return this.length;
            },
            set: function() {}
        });
        Object.defineProperty(Function.prototype, "nv_toString", {
            writable: true,
            value: function() {
                return "[function Function]"
            }
        })
    }
    var nf_init_Array = function() {
        Object.defineProperty(Array.prototype, "nv_toString", {
            writable: true,
            value: function() {
                return this.nv_join();
            }
        })
        Object.defineProperty(Array.prototype, "nv_join", {
            writable: true,
            value: function(s) {
                s = undefined == s ? ',' : s;
                var r = "";
                for (var i = 0; i < this.length; ++i) {
                    if (0 != i) r += s;
                    if (null == this[i] || undefined == this[i]) r += '';
                    else if (typeof this[i] == 'function') r += this[i].nv_toString();
                    else if (typeof this[i] == 'object' && this[i].nv_constructor === "Array") r += this[i].nv_join();
                    else r += this[i].toString();
                }
                return r;
            }
        })
        Object.defineProperty(Array.prototype, "nv_constructor", {
            writable: true,
            value: "Array"
        })
        Object.defineProperty(Array.prototype, "nv_concat", {
            writable: true,
            value: Array.prototype.concat
        })
        Object.defineProperty(Array.prototype, "nv_pop", {
            writable: true,
            value: Array.prototype.pop
        })
        Object.defineProperty(Array.prototype, "nv_push", {
            writable: true,
            value: Array.prototype.push
        })
        Object.defineProperty(Array.prototype, "nv_reverse", {
            writable: true,
            value: Array.prototype.reverse
        })
        Object.defineProperty(Array.prototype, "nv_shift", {
            writable: true,
            value: Array.prototype.shift
        })
        Object.defineProperty(Array.prototype, "nv_slice", {
            writable: true,
            value: Array.prototype.slice
        })
        Object.defineProperty(Array.prototype, "nv_sort", {
            writable: true,
            value: Array.prototype.sort
        })
        Object.defineProperty(Array.prototype, "nv_splice", {
            writable: true,
            value: Array.prototype.splice
        })
        Object.defineProperty(Array.prototype, "nv_unshift", {
            writable: true,
            value: Array.prototype.unshift
        })
        Object.defineProperty(Array.prototype, "nv_indexOf", {
            writable: true,
            value: Array.prototype.indexOf
        })
        Object.defineProperty(Array.prototype, "nv_lastIndexOf", {
            writable: true,
            value: Array.prototype.lastIndexOf
        })
        Object.defineProperty(Array.prototype, "nv_every", {
            writable: true,
            value: Array.prototype.every
        })
        Object.defineProperty(Array.prototype, "nv_some", {
            writable: true,
            value: Array.prototype.some
        })
        Object.defineProperty(Array.prototype, "nv_forEach", {
            writable: true,
            value: Array.prototype.forEach
        })
        Object.defineProperty(Array.prototype, "nv_map", {
            writable: true,
            value: Array.prototype.map
        })
        Object.defineProperty(Array.prototype, "nv_filter", {
            writable: true,
            value: Array.prototype.filter
        })
        Object.defineProperty(Array.prototype, "nv_reduce", {
            writable: true,
            value: Array.prototype.reduce
        })
        Object.defineProperty(Array.prototype, "nv_reduceRight", {
            writable: true,
            value: Array.prototype.reduceRight
        })
        Object.defineProperty(Array.prototype, "nv_length", {get: function() {
                return this.length;
            },
            set: function(value) {
                this.length = value;
            }
        });
    }
    var nf_init_String = function() {
        Object.defineProperty(String.prototype, "nv_constructor", {
            writable: true,
            value: "String"
        })
        Object.defineProperty(String.prototype, "nv_toString", {
            writable: true,
            value: String.prototype.toString
        })
        Object.defineProperty(String.prototype, "nv_valueOf", {
            writable: true,
            value: String.prototype.valueOf
        })
        Object.defineProperty(String.prototype, "nv_charAt", {
            writable: true,
            value: String.prototype.charAt
        })
        Object.defineProperty(String.prototype, "nv_charCodeAt", {
            writable: true,
            value: String.prototype.charCodeAt
        })
        Object.defineProperty(String.prototype, "nv_concat", {
            writable: true,
            value: String.prototype.concat
        })
        Object.defineProperty(String.prototype, "nv_indexOf", {
            writable: true,
            value: String.prototype.indexOf
        })
        Object.defineProperty(String.prototype, "nv_lastIndexOf", {
            writable: true,
            value: String.prototype.lastIndexOf
        })
        Object.defineProperty(String.prototype, "nv_localeCompare", {
            writable: true,
            value: String.prototype.localeCompare
        })
        Object.defineProperty(String.prototype, "nv_match", {
            writable: true,
            value: String.prototype.match
        })
        Object.defineProperty(String.prototype, "nv_replace", {
            writable: true,
            value: String.prototype.replace
        })
        Object.defineProperty(String.prototype, "nv_search", {
            writable: true,
            value: String.prototype.search
        })
        Object.defineProperty(String.prototype, "nv_slice", {
            writable: true,
            value: String.prototype.slice
        })
        Object.defineProperty(String.prototype, "nv_split", {
            writable: true,
            value: String.prototype.split
        })
        Object.defineProperty(String.prototype, "nv_substring", {
            writable: true,
            value: String.prototype.substring
        })
        Object.defineProperty(String.prototype, "nv_toLowerCase", {
            writable: true,
            value: String.prototype.toLowerCase
        })
        Object.defineProperty(String.prototype, "nv_toLocaleLowerCase", {
            writable: true,
            value: String.prototype.toLocaleLowerCase
        })
        Object.defineProperty(String.prototype, "nv_toUpperCase", {
            writable: true,
            value: String.prototype.toUpperCase
        })
        Object.defineProperty(String.prototype, "nv_toLocaleUpperCase", {
            writable: true,
            value: String.prototype.toLocaleUpperCase
        })
        Object.defineProperty(String.prototype, "nv_trim", {
            writable: true,
            value: String.prototype.trim
        })
        Object.defineProperty(String.prototype, "nv_length", {get: function() {
                return this.length;
            },
            set: function(value) {
                this.length = value;
            }
        });
    }
    var nf_init_Boolean = function() {
        Object.defineProperty(Boolean.prototype, "nv_constructor", {
            writable: true,
            value: "Boolean"
        })
        Object.defineProperty(Boolean.prototype, "nv_toString", {
            writable: true,
            value: Boolean.prototype.toString
        })
        Object.defineProperty(Boolean.prototype, "nv_valueOf", {
            writable: true,
            value: Boolean.prototype.valueOf
        })
    }
    var nf_init_Number = function() {
        Object.defineProperty(Number, "nv_MAX_VALUE", {
            writable: false,
            value: Number.MAX_VALUE
        })
        Object.defineProperty(Number, "nv_MIN_VALUE", {
            writable: false,
            value: Number.MIN_VALUE
        })
        Object.defineProperty(Number, "nv_NEGATIVE_INFINITY", {
            writable: false,
            value: Number.NEGATIVE_INFINITY
        })
        Object.defineProperty(Number, "nv_POSITIVE_INFINITY", {
            writable: false,
            value: Number.POSITIVE_INFINITY
        })
        Object.defineProperty(Number.prototype, "nv_constructor", {
            writable: true,
            value: "Number"
        })
        Object.defineProperty(Number.prototype, "nv_toString", {
            writable: true,
            value: Number.prototype.toString
        })
        Object.defineProperty(Number.prototype, "nv_toLocaleString", {
            writable: true,
            value: Number.prototype.toLocaleString
        })
        Object.defineProperty(Number.prototype, "nv_valueOf", {
            writable: true,
            value: Number.prototype.valueOf
        })
        Object.defineProperty(Number.prototype, "nv_toFixed", {
            writable: true,
            value: Number.prototype.toFixed
        })
        Object.defineProperty(Number.prototype, "nv_toExponential", {
            writable: true,
            value: Number.prototype.toExponential
        })
        Object.defineProperty(Number.prototype, "nv_toPrecision", {
            writable: true,
            value: Number.prototype.toPrecision
        })
    }
    var nf_init_Math = function() {
        Object.defineProperty(Math, "nv_E", {
            writable: false,
            value: Math.E
        })
        Object.defineProperty(Math, "nv_LN10", {
            writable: false,
            value: Math.LN10
        })
        Object.defineProperty(Math, "nv_LN2", {
            writable: false,
            value: Math.LN2
        })
        Object.defineProperty(Math, "nv_LOG2E", {
            writable: false,
            value: Math.LOG2E
        })
        Object.defineProperty(Math, "nv_LOG10E", {
            writable: false,
            value: Math.LOG10E
        })
        Object.defineProperty(Math, "nv_PI", {
            writable: false,
            value: Math.PI
        })
        Object.defineProperty(Math, "nv_SQRT1_2", {
            writable: false,
            value: Math.SQRT1_2
        })
        Object.defineProperty(Math, "nv_SQRT2", {
            writable: false,
            value: Math.SQRT2
        })
        Object.defineProperty(Math, "nv_abs", {
            writable: false,
            value: Math.abs
        })
        Object.defineProperty(Math, "nv_acos", {
            writable: false,
            value: Math.acos
        })
        Object.defineProperty(Math, "nv_asin", {
            writable: false,
            value: Math.asin
        })
        Object.defineProperty(Math, "nv_atan", {
            writable: false,
            value: Math.atan
        })
        Object.defineProperty(Math, "nv_atan2", {
            writable: false,
            value: Math.atan2
        })
        Object.defineProperty(Math, "nv_ceil", {
            writable: false,
            value: Math.ceil
        })
        Object.defineProperty(Math, "nv_cos", {
            writable: false,
            value: Math.cos
        })
        Object.defineProperty(Math, "nv_exp", {
            writable: false,
            value: Math.exp
        })
        Object.defineProperty(Math, "nv_floor", {
            writable: false,
            value: Math.floor
        })
        Object.defineProperty(Math, "nv_log", {
            writable: false,
            value: Math.log
        })
        Object.defineProperty(Math, "nv_max", {
            writable: false,
            value: Math.max
        })
        Object.defineProperty(Math, "nv_min", {
            writable: false,
            value: Math.min
        })
        Object.defineProperty(Math, "nv_pow", {
            writable: false,
            value: Math.pow
        })
        Object.defineProperty(Math, "nv_random", {
            writable: false,
            value: Math.random
        })
        Object.defineProperty(Math, "nv_round", {
            writable: false,
            value: Math.round
        })
        Object.defineProperty(Math, "nv_sin", {
            writable: false,
            value: Math.sin
        })
        Object.defineProperty(Math, "nv_sqrt", {
            writable: false,
            value: Math.sqrt
        })
        Object.defineProperty(Math, "nv_tan", {
            writable: false,
            value: Math.tan
        })
    }
    var nf_init_Date = function() {
        Object.defineProperty(Date.prototype, "nv_constructor", {
            writable: true,
            value: "Date"
        })
        Object.defineProperty(Date, "nv_parse", {
            writable: true,
            value: Date.parse
        })
        Object.defineProperty(Date, "nv_UTC", {
            writable: true,
            value: Date.UTC
        })
        Object.defineProperty(Date, "nv_now", {
            writable: true,
            value: Date.now
        })
        Object.defineProperty(Date.prototype, "nv_toString", {
            writable: true,
            value: Date.prototype.toString
        })
        Object.defineProperty(Date.prototype, "nv_toDateString", {
            writable: true,
            value: Date.prototype.toDateString
        })
        Object.defineProperty(Date.prototype, "nv_toTimeString", {
            writable: true,
            value: Date.prototype.toTimeString
        })
        Object.defineProperty(Date.prototype, "nv_toLocaleString", {
            writable: true,
            value: Date.prototype.toLocaleString
        })
        Object.defineProperty(Date.prototype, "nv_toLocaleDateString", {
            writable: true,
            value: Date.prototype.toLocaleDateString
        })
        Object.defineProperty(Date.prototype, "nv_toLocaleTimeString", {
            writable: true,
            value: Date.prototype.toLocaleTimeString
        })
        Object.defineProperty(Date.prototype, "nv_valueOf", {
            writable: true,
            value: Date.prototype.valueOf
        })
        Object.defineProperty(Date.prototype, "nv_getTime", {
            writable: true,
            value: Date.prototype.getTime
        })
        Object.defineProperty(Date.prototype, "nv_getFullYear", {
            writable: true,
            value: Date.prototype.getFullYear
        })
        Object.defineProperty(Date.prototype, "nv_getUTCFullYear", {
            writable: true,
            value: Date.prototype.getUTCFullYear
        })
        Object.defineProperty(Date.prototype, "nv_getMonth", {
            writable: true,
            value: Date.prototype.getMonth
        })
        Object.defineProperty(Date.prototype, "nv_getUTCMonth", {
            writable: true,
            value: Date.prototype.getUTCMonth
        })
        Object.defineProperty(Date.prototype, "nv_getDate", {
            writable: true,
            value: Date.prototype.getDate
        })
        Object.defineProperty(Date.prototype, "nv_getUTCDate", {
            writable: true,
            value: Date.prototype.getUTCDate
        })
        Object.defineProperty(Date.prototype, "nv_getDay", {
            writable: true,
            value: Date.prototype.getDay
        })
        Object.defineProperty(Date.prototype, "nv_getUTCDay", {
            writable: true,
            value: Date.prototype.getUTCDay
        })
        Object.defineProperty(Date.prototype, "nv_getHours", {
            writable: true,
            value: Date.prototype.getHours
        })
        Object.defineProperty(Date.prototype, "nv_getUTCHours", {
            writable: true,
            value: Date.prototype.getUTCHours
        })
        Object.defineProperty(Date.prototype, "nv_getMinutes", {
            writable: true,
            value: Date.prototype.getMinutes
        })
        Object.defineProperty(Date.prototype, "nv_getUTCMinutes", {
            writable: true,
            value: Date.prototype.getUTCMinutes
        })
        Object.defineProperty(Date.prototype, "nv_getSeconds", {
            writable: true,
            value: Date.prototype.getSeconds
        })
        Object.defineProperty(Date.prototype, "nv_getUTCSeconds", {
            writable: true,
            value: Date.prototype.getUTCSeconds
        })
        Object.defineProperty(Date.prototype, "nv_getMilliseconds", {
            writable: true,
            value: Date.prototype.getMilliseconds
        })
        Object.defineProperty(Date.prototype, "nv_getUTCMilliseconds", {
            writable: true,
            value: Date.prototype.getUTCMilliseconds
        })
        Object.defineProperty(Date.prototype, "nv_getTimezoneOffset", {
            writable: true,
            value: Date.prototype.getTimezoneOffset
        })
        Object.defineProperty(Date.prototype, "nv_setTime", {
            writable: true,
            value: Date.prototype.setTime
        })
        Object.defineProperty(Date.prototype, "nv_setMilliseconds", {
            writable: true,
            value: Date.prototype.setMilliseconds
        })
        Object.defineProperty(Date.prototype, "nv_setUTCMilliseconds", {
            writable: true,
            value: Date.prototype.setUTCMilliseconds
        })
        Object.defineProperty(Date.prototype, "nv_setSeconds", {
            writable: true,
            value: Date.prototype.setSeconds
        })
        Object.defineProperty(Date.prototype, "nv_setUTCSeconds", {
            writable: true,
            value: Date.prototype.setUTCSeconds
        })
        Object.defineProperty(Date.prototype, "nv_setMinutes", {
            writable: true,
            value: Date.prototype.setMinutes
        })
        Object.defineProperty(Date.prototype, "nv_setUTCMinutes", {
            writable: true,
            value: Date.prototype.setUTCMinutes
        })
        Object.defineProperty(Date.prototype, "nv_setHours", {
            writable: true,
            value: Date.prototype.setHours
        })
        Object.defineProperty(Date.prototype, "nv_setUTCHours", {
            writable: true,
            value: Date.prototype.setUTCHours
        })
        Object.defineProperty(Date.prototype, "nv_setDate", {
            writable: true,
            value: Date.prototype.setDate
        })
        Object.defineProperty(Date.prototype, "nv_setUTCDate", {
            writable: true,
            value: Date.prototype.setUTCDate
        })
        Object.defineProperty(Date.prototype, "nv_setMonth", {
            writable: true,
            value: Date.prototype.setMonth
        })
        Object.defineProperty(Date.prototype, "nv_setUTCMonth", {
            writable: true,
            value: Date.prototype.setUTCMonth
        })
        Object.defineProperty(Date.prototype, "nv_setFullYear", {
            writable: true,
            value: Date.prototype.setFullYear
        })
        Object.defineProperty(Date.prototype, "nv_setUTCFullYear", {
            writable: true,
            value: Date.prototype.setUTCFullYear
        })
        Object.defineProperty(Date.prototype, "nv_toUTCString", {
            writable: true,
            value: Date.prototype.toUTCString
        })
        Object.defineProperty(Date.prototype, "nv_toISOString", {
            writable: true,
            value: Date.prototype.toISOString
        })
        Object.defineProperty(Date.prototype, "nv_toJSON", {
            writable: true,
            value: Date.prototype.toJSON
        })
    }
    var nf_init_RegExp = function() {
        Object.defineProperty(RegExp.prototype, "nv_constructor", {
            writable: true,
            value: "RegExp"
        })
        Object.defineProperty(RegExp.prototype, "nv_exec", {
            writable: true,
            value: RegExp.prototype.exec
        })
        Object.defineProperty(RegExp.prototype, "nv_test", {
            writable: true,
            value: RegExp.prototype.test
        })
        Object.defineProperty(RegExp.prototype, "nv_toString", {
            writable: true,
            value: RegExp.prototype.toString
        })
        Object.defineProperty(RegExp.prototype, "nv_source", {get: function() {
                return this.source;
            },
            set: function() {}
        });
        Object.defineProperty(RegExp.prototype, "nv_global", {get: function() {
                return this.global;
            },
            set: function() {}
        });
        Object.defineProperty(RegExp.prototype, "nv_ignoreCase", {get: function() {
                return this.ignoreCase;
            },
            set: function() {}
        });
        Object.defineProperty(RegExp.prototype, "nv_multiline", {get: function() {
                return this.multiline;
            },
            set: function() {}
        });
        Object.defineProperty(RegExp.prototype, "nv_lastIndex", {get: function() {
                return this.lastIndex;
            },
            set: function(v) {
                this.lastIndex = v;
            }
        });
    }
    nf_init();
    var nv_getDate = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(Date);
        return new(Function.prototype.bind.apply(Date, args));
    }
    var nv_getRegExp = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(RegExp);
        return new(Function.prototype.bind.apply(RegExp, args));
    }
    var nv_console = {}
    nv_console.nv_log = function() {
        var res = "WXSRT:";
        for (var i = 0; i < arguments.length; ++i) res += arguments[i] + " ";
        console.log(res);
    }
    var nv_parseInt = parseInt,
        nv_parseFloat = parseFloat,
        nv_isNaN = isNaN,
        nv_isFinite = isFinite,
        nv_decodeURI = decodeURI,
        nv_decodeURIComponent = decodeURIComponent,
        nv_encodeURI = encodeURI,
        nv_encodeURIComponent = encodeURIComponent;

    function $gdc(o, p, r) {
        o = wh.rv(o);
        if (o === null || o === undefined) return o;
        if (typeof o === "string" || typeof o === "boolean" || typeof o === "number") return o;
        if (o.constructor === Object) {
            var copy = {};
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k))
                    if (undefined === p) copy[k.substring(3)] = $gdc(o[k], p, r);
                    else copy[p + k] = $gdc(o[k], p, r);
            return copy;
        }
        if (o.constructor === Array) {
            var copy = [];
            for (var i = 0; i < o.length; i++) copy.push($gdc(o[i], p, r));
            return copy;
        }
        if (o.constructor === Date) {
            var copy = new Date();
            copy.setTime(o.getTime());
            return copy;
        }
        if (o.constructor === RegExp) {
            var f = "";
            if (o.global) f += "g";
            if (o.ignoreCase) f += "i";
            if (o.multiline) f += "m";
            return (new RegExp(o.source, f));
        }
        if (r && typeof o === "function") {
            if (r == 1) return $gdc(o(), undefined, 2);
            if (r == 2) return o;
        }
        return null;
    }
    var nv_JSON = {}
    nv_JSON.nv_stringify = function(o) {
        JSON.stringify(o);
        return JSON.stringify($gdc(o));
    }
    nv_JSON.nv_parse = function(o) {
        if (o === undefined) return undefined;
        var t = JSON.parse(o);
        return $gdc(t, 'nv_');
    }

    function _af(p, a, r, c) {
        p.extraAttr = {
            "t_action": a,
            "t_rawid": r
        };
        if (typeof(c) != 'undefined') p.extraAttr.t_cid = c;
    }

    function _ai(i, p, e, me, r, c) {
        var x = _grp(p, e, me);
        if (x) i.push(x);
        else {
            i.push('');
            _wp(me + ':import:' + r + ':' + c + ': Path `' + p + '` not found from `' + me + '`.')
        }
    }

    function _grp(p, e, me) {
        if (p[0] != '/') {
            var mepart = me.split('/');
            mepart.pop();
            var ppart = p.split('/');
            for (var i = 0; i < ppart.length; i++) {
                if (ppart[i] == '..') mepart.pop();
                else if (!ppart[i] || ppart[i] == '.') continue;
                else mepart.push(ppart[i]);
            }
            p = mepart.join('/');
        }
        if (me[0] == '.' && p[0] == '/') p = '.' + p;
        if (e[p]) return p;
        if (e[p + '.wxml']) return p + '.wxml';
    }

    function _gd(p, c, e, d) {
        if (!c) return;
        if (d[p][c]) return d[p][c];
        for (var x = e[p].i.length - 1; x >= 0; x--) {
            if (e[p].i[x] && d[e[p].i[x]][c]) return d[e[p].i[x]][c]
        };
        for (var x = e[p].ti.length - 1; x >= 0; x--) {
            var q = _grp(e[p].ti[x], e, p);
            if (q && d[q][c]) return d[q][c]
        }
        var ii = _gapi(e, p);
        for (var x = 0; x < ii.length; x++) {
            if (ii[x] && d[ii[x]][c]) return d[ii[x]][c]
        }
        for (var k = e[p].j.length - 1; k >= 0; k--)
            if (e[p].j[k]) {
                for (var q = e[e[p].j[k]].ti.length - 1; q >= 0; q--) {
                    var pp = _grp(e[e[p].j[k]].ti[q], e, p);
                    if (pp && d[pp][c]) {
                        return d[pp][c]
                    }
                }
            }
    }

    function _gapi(e, p) {
        if (!p) return [];
        if ($gaic[p]) {
            return $gaic[p]
        };
        var ret = [],
            q = [],
            h = 0,
            t = 0,
            put = {},
            visited = {};
        q.push(p);
        visited[p] = true;
        t++;
        while (h < t) {
            var a = q[h++];
            for (var i = 0; i < e[a].ic.length; i++) {
                var nd = e[a].ic[i];
                var np = _grp(nd, e, a);
                if (np && !visited[np]) {
                    visited[np] = true;
                    q.push(np);
                    t++;
                }
            }
            for (var i = 0; a != p && i < e[a].ti.length; i++) {
                var ni = e[a].ti[i];
                var nm = _grp(ni, e, a);
                if (nm && !put[nm]) {
                    put[nm] = true;
                    ret.push(nm);
                }
            }
        }
        $gaic[p] = ret;
        return ret;
    }
    var $ixc = {};

    function _ic(p, ent, me, e, s, r, gg) {
        var x = _grp(p, ent, me);
        ent[me].j.push(x);
        if (x) {
            if ($ixc[x]) {
                _wp('-1:include:-1:-1: `' + p + '` is being included in a loop, will be stop.');
                return;
            }
            $ixc[x] = true;
            try {
                ent[x].f(e, s, r, gg)
            } catch (e) {}
            $ixc[x] = false;
        } else {
            _wp(me + ':include:-1:-1: Included path `' + p + '` not found from `' + me + '`.')
        }
    }

    function _w(tn, f, line, c) {
        _wp(f + ':template:' + line + ':' + c + ': Template `' + tn + '` not found.');
    }

    function _ev(dom) {
        var changed = false;
        delete dom.properities;
        delete dom.n;
        if (dom.children) {
            do {
                changed = false;
                var newch = [];
                for (var i = 0; i < dom.children.length; i++) {
                    var ch = dom.children[i];
                    if (ch.tag == 'virtual') {
                        changed = true;
                        for (var j = 0; ch.children && j < ch.children.length; j++) {
                            newch.push(ch.children[j]);
                        }
                    } else {
                        newch.push(ch);
                    }
                }
                dom.children = newch;
            } while (changed);
            for (var i = 0; i < dom.children.length; i++) {
                _ev(dom.children[i]);
            }
        }
        return dom;
    }

    function _tsd(root) {
        if (root.tag == "wx-wx-scope") {
            root.tag = "virtual";
            root.wxCkey = "11";
            root['wxScopeData'] = root.attr['wx:scope-data'];
            delete root.n;
            delete root.raw;
            delete root.generics;
            delete root.attr;
        }
        for (var i = 0; root.children && i < root.children.length; i++) {
            _tsd(root.children[i]);
        }
        return root;
    }

    var e_ = {}
    if (typeof(global.entrys) === 'undefined') global.entrys = {};
    e_ = global.entrys;
    var d_ = {}
    if (typeof(global.defines) === 'undefined') global.defines = {};
    d_ = global.defines;
    var f_ = {}
    if (typeof(global.modules) === 'undefined') global.modules = {};
    f_ = global.modules || {};
    var p_ = {}
    __WXML_GLOBAL__.ops_cached = __WXML_GLOBAL__.ops_cached || {}
    __WXML_GLOBAL__.ops_set = __WXML_GLOBAL__.ops_set || {};
    __WXML_GLOBAL__.ops_init = __WXML_GLOBAL__.ops_init || {};
    var z = __WXML_GLOBAL__.ops_set.$gwx0 || [];

    function gz$gwx0_1() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_1) return __WXML_GLOBAL__.ops_cached.$gwx0_1
        __WXML_GLOBAL__.ops_cached.$gwx0_1 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
        })(__WXML_GLOBAL__.ops_cached.$gwx0_1);
        return __WXML_GLOBAL__.ops_cached.$gwx0_1
    }

    function gz$gwx0_2() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_2) return __WXML_GLOBAL__.ops_cached.$gwx0_2
        __WXML_GLOBAL__.ops_cached.$gwx0_2 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([
                [2, '!'],
                [
                    [7],
                    [3, 'secretkey']
                ]
            ])
            Z([
                [7],
                [3, 'calendarData']
            ])
            Z([3, 'clickDate'])
            Z([a, [3, 'date-li '],
                [
                    [2, '?:'],
                    [
                        [2, '=='],
                        [
                            [6],
                            [
                                [7],
                                [3, 'item']
                            ],
                            [3, 'status']
                        ],
                        [1, 4]
                    ],
                    [1, 'ticket'],
                    [1, '']
                ],
                [3, ' '],
                [
                    [2, '?:'],
                    [
                        [2, '=='],
                        [
                            [7],
                            [3, 'chooseDate']
                        ],
                        [
                            [6],
                            [
                                [7],
                                [3, 'item']
                            ],
                            [3, 'currentDate']
                        ]
                    ],
                    [1, 'act'],
                    [1, '']
                ]
            ])
            Z([
                [7],
                [3, 'item']
            ])
            Z([
                [6],
                [
                    [7],
                    [3, 'item']
                ],
                [3, 'today']
            ])
            Z([
                [2, '||'],
                [
                    [2, '=='],
                    [
                        [6],
                        [
                            [7],
                            [3, 'item']
                        ],
                        [3, 'status']
                    ],
                    [
                        [2, '-'],
                        [1, 1]
                    ]
                ],
                [
                    [2, '=='],
                    [
                        [6],
                        [
                            [7],
                            [3, 'item']
                        ],
                        [3, 'status']
                    ],
                    [1, 1]
                ]
            ])
            Z([
                [2, '=='],
                [
                    [6],
                    [
                        [7],
                        [3, 'item']
                    ],
                    [3, 'status']
                ],
                [1, 0]
            ])
            Z([
                [2, '=='],
                [
                    [6],
                    [
                        [7],
                        [3, 'item']
                    ],
                    [3, 'status']
                ],
                [1, 2]
            ])
            Z([
                [2, '=='],
                [
                    [6],
                    [
                        [7],
                        [3, 'item']
                    ],
                    [3, 'status']
                ],
                [1, 3]
            ])
            Z([
                [2, '=='],
                [
                    [6],
                    [
                        [7],
                        [3, 'item']
                    ],
                    [3, 'status']
                ],
                [1, 4]
            ])
            Z([
                [2, '||'],
                [
                    [2, '||'],
                    [
                        [2, '>'],
                        [
                            [6],
                            [
                                [7],
                                [3, 'hallList']
                            ],
                            [3, 'length']
                        ],
                        [1, 1]
                    ],
                    [
                        [2, '=='],
                        [
                            [6],
                            [
                                [7],
                                [3, 'hallList']
                            ],
                            [3, 'length']
                        ],
                        [1, 0]
                    ]
                ],
                [
                    [7],
                    [3, 'secretkey']
                ]
            ])
            Z([3, 'time-box'])
            Z([
                [2, '||'],
                [
                    [2, '>'],
                    [
                        [6],
                        [
                            [7],
                            [3, 'hallList']
                        ],
                        [3, 'length']
                    ],
                    [1, 1]
                ],
                [
                    [7],
                    [3, 'secretkey']
                ]
            ])
            Z([
                [7],
                [3, 'hallList']
            ])
            Z([3, 'clickHall'])
            Z([a, [3, 'hall-item '],
                [
                    [2, '?:'],
                    [
                        [2, '&&'],
                        [
                            [2, '=='],
                            [
                                [6],
                                [
                                    [7],
                                    [3, 'item']
                                ],
                                [3, 'hallId']
                            ],
                            [
                                [7],
                                [3, 'hallId']
                            ]
                        ],
                        [
                            [2, '!=='],
                            [
                                [6],
                                [
                                    [7],
                                    [3, 'item']
                                ],
                                [3, 'status']
                            ],
                            [1, 0]
                        ]
                    ],
                    [1, 'act'],
                    [1, '']
                ], z[3][3],
                [
                    [2, '?:'],
                    [
                        [2, '!='],
                        [
                            [6],
                            [
                                [7],
                                [3, 'item']
                            ],
                            [3, 'status']
                        ],
                        [1, 4]
                    ],
                    [1, 'disable'],
                    [1, '']
                ]
            ])
            Z(z[4])
            Z([
                [2, '=='],
                [
                    [6],
                    [
                        [7],
                        [3, 'item']
                    ],
                    [3, 'status']
                ],
                [1, 4]
            ])
            Z(z[12])
            Z([
                [2, '>'],
                [
                    [6],
                    [
                        [7],
                        [3, 'scheduleList']
                    ],
                    [3, 'length']
                ],
                [1, 0]
            ])
            Z([
                [7],
                [3, 'scheduleList']
            ])
            Z([3, 'clickSchedule'])
            Z([a, [3, 'schedule-item '],
                [
                    [2, '?:'],
                    [
                        [2, '=='],
                        [
                            [6],
                            [
                                [7],
                                [3, 'item']
                            ],
                            [3, 'hallScheduleId']
                        ],
                        [
                            [7],
                            [3, 'scheduleId']
                        ]
                    ],
                    [1, 'act'],
                    [1, '']
                ], z[3][3], z[16][4]
            ])
            Z(z[4])
            Z(z[10])
            Z([
                [2, '&&'],
                [
                    [2, '=='],
                    [
                        [6],
                        [
                            [7],
                            [3, 'item']
                        ],
                        [3, 'ticketPool']
                    ],
                    [1, 0]
                ],
                [
                    [2, '=='],
                    [
                        [6],
                        [
                            [7],
                            [3, 'item']
                        ],
                        [3, 'status']
                    ],
                    [1, 3]
                ]
            ])
            Z([
                [2, '||'],
                [
                    [2, '||'],
                    [
                        [2, '=='],
                        [
                            [6],
                            [
                                [7],
                                [3, 'item']
                            ],
                            [3, 'status']
                        ],
                        [1, 2]
                    ],
                    [
                        [2, '=='],
                        [
                            [6],
                            [
                                [7],
                                [3, 'item']
                            ],
                            [3, 'status']
                        ],
                        [1, 1]
                    ]
                ],
                [
                    [2, '&&'],
                    [
                        [2, '=='],
                        [
                            [6],
                            [
                                [7],
                                [3, 'item']
                            ],
                            [3, 'status']
                        ],
                        [1, 0]
                    ],
                    [
                        [2, '!='],
                        [
                            [6],
                            [
                                [7],
                                [3, 'item']
                            ],
                            [3, 'status']
                        ],
                        [1, 3]
                    ]
                ]
            ])
            Z([
                [7],
                [3, 'hallDataTips']
            ])
            Z(z[28])
            Z([
                [7],
                [3, 'base_url']
            ])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_2);
        return __WXML_GLOBAL__.ops_cached.$gwx0_2
    }

    function gz$gwx0_3() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_3) return __WXML_GLOBAL__.ops_cached.$gwx0_3
        __WXML_GLOBAL__.ops_cached.$gwx0_3 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([
                [7],
                [3, 'showCpsule']
            ])
            Z([
                [7],
                [3, 'seize']
            ])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_3);
        return __WXML_GLOBAL__.ops_cached.$gwx0_3
    }

    function gz$gwx0_4() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_4) return __WXML_GLOBAL__.ops_cached.$gwx0_4
        __WXML_GLOBAL__.ops_cached.$gwx0_4 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'return'])
            Z([3, 'dialog'])
            Z([3, 'onClose'])
            Z([1, true])
            Z([3, 'scrollToBottom'])
            Z([3, 'content'])
            Z([
                [7],
                [3, 'content']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_4);
        return __WXML_GLOBAL__.ops_cached.$gwx0_4
    }

    function gz$gwx0_5() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_5) return __WXML_GLOBAL__.ops_cached.$gwx0_5
        __WXML_GLOBAL__.ops_cached.$gwx0_5 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'closeAction'])
            Z([
                [2, '+'],
                [
                    [7],
                    [3, 'base_url']
                ],
                [1, '/profile/wxmini_pic/a-weibiaoti-1_huaban14.png']
            ])
            Z([3, 'top-left'])
            Z([3, 'height: 700rpx;'])
            Z([3, 'bottom'])
            Z([1, true])
            Z([1, false])
            Z([3, 'finished'])
            Z([3, 'control-count-down'])
            Z([3, 'mm:ss'])
            Z([
                [7],
                [3, 'time']
            ])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_5);
        return __WXML_GLOBAL__.ops_cached.$gwx0_5
    }

    function gz$gwx0_6() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_6) return __WXML_GLOBAL__.ops_cached.$gwx0_6
        __WXML_GLOBAL__.ops_cached.$gwx0_6 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'container'])
            Z([3, 'contact-box'])
            Z([
                [7],
                [3, 'contactList']
            ])
            Z([
                [2, '||'],
                [
                    [2, '&&'],
                    [
                        [2, '!'],
                        [
                            [7],
                            [3, 'showMoreContact']
                        ]
                    ],
                    [
                        [2, '<'],
                        [
                            [7],
                            [3, 'index']
                        ],
                        [1, 5]
                    ]
                ],
                [
                    [7],
                    [3, 'showMoreContact']
                ]
            ])
            Z([
                [2, '&&'],
                [
                    [2, '!'],
                    [
                        [7],
                        [3, 'showMoreContact']
                    ]
                ],
                [
                    [2, '=='],
                    [
                        [6],
                        [
                            [7],
                            [3, 'contactList']
                        ],
                        [3, 'length']
                    ],
                    [1, 6]
                ]
            ])
            Z([
                [2, '&&'],
                [
                    [2, '!'],
                    [
                        [7],
                        [3, 'showMoreContact']
                    ]
                ],
                [
                    [2, '>'],
                    [
                        [6],
                        [
                            [7],
                            [3, 'contactList']
                        ],
                        [3, 'length']
                    ],
                    [1, 6]
                ]
            ])
            Z([
                [7],
                [3, 'tableData']
            ])
            Z([3, 'person-info'])
            Z([3, 'person-base-info-box'])
            Z([
                [7],
                [3, 'showOcr']
            ])
            Z([3, 'ocrInput'])
            Z([
                [7],
                [3, 'index']
            ])
            Z([1, false])
            Z(z[12])
            Z(z[12])
            Z([
                [2, '>'],
                [
                    [6],
                    [
                        [7],
                        [3, 'tableData']
                    ],
                    [3, 'length']
                ],
                [1, 1]
            ])
            Z([3, 'ticketChange'])
            Z(z[11])
            Z([
                [6],
                [
                    [7],
                    [3, 'item']
                ],
                [3, 'priceId']
            ])
            Z([3, 'ticketIndex'])
            Z([3, 'ticket'])
            Z([
                [6],
                [
                    [7],
                    [3, 'item']
                ],
                [3, 'ticketList']
            ])
            Z([3, 'clickTicket'])
            Z([3, '#D23719'])
            Z([3, 'radio'])
            Z([
                [7],
                [3, 'item']
            ])
            Z([
                [7],
                [3, 'ticket']
            ])
            Z([
                [2, '||'],
                [
                    [2, '!'],
                    [
                        [6],
                        [
                            [7],
                            [3, 'ticket']
                        ],
                        [3, 'canCheck']
                    ]
                ],
                [
                    [2, '!='],
                    [
                        [6],
                        [
                            [7],
                            [3, 'ticket']
                        ],
                        [3, 'status']
                    ],
                    [1, 4]
                ]
            ])
            Z([
                [6],
                [
                    [7],
                    [3, 'ticket']
                ],
                [3, 'priceId']
            ])
            Z([
                [6],
                [
                    [7],
                    [3, 'ticket']
                ],
                [3, 'document']
            ])
            Z([
                [2, '<'],
                [
                    [6],
                    [
                        [7],
                        [3, 'tableData']
                    ],
                    [3, 'length']
                ],
                [
                    [7],
                    [3, 'maxPerson']
                ]
            ])
            Z([
                [7],
                [3, 'dialogShow']
            ])
            Z(z[12])
            Z([
                [7],
                [3, 'ticketTip']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_6);
        return __WXML_GLOBAL__.ops_cached.$gwx0_6
    }

    function gz$gwx0_7() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_7) return __WXML_GLOBAL__.ops_cached.$gwx0_7
        __WXML_GLOBAL__.ops_cached.$gwx0_7 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'return'])
            Z([3, 'dialog'])
            Z([3, 'onClose'])
            Z([1, true])
            Z([3, 'scrollToBottom'])
            Z([3, 'content'])
            Z([
                [7],
                [3, 'content']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_7);
        return __WXML_GLOBAL__.ops_cached.$gwx0_7
    }

    function gz$gwx0_8() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_8) return __WXML_GLOBAL__.ops_cached.$gwx0_8
        __WXML_GLOBAL__.ops_cached.$gwx0_8 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'content'])
            Z([
                [6],
                [
                    [7],
                    [3, 'detail']
                ],
                [3, 'content']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_8);
        return __WXML_GLOBAL__.ops_cached.$gwx0_8
    }

    function gz$gwx0_9() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_9) return __WXML_GLOBAL__.ops_cached.$gwx0_9
        __WXML_GLOBAL__.ops_cached.$gwx0_9 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
        })(__WXML_GLOBAL__.ops_cached.$gwx0_9);
        return __WXML_GLOBAL__.ops_cached.$gwx0_9
    }

    function gz$gwx0_10() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_10) return __WXML_GLOBAL__.ops_cached.$gwx0_10
        __WXML_GLOBAL__.ops_cached.$gwx0_10 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'confirm safe-page'])
            Z([
                [7],
                [3, 'isShowPayDialog']
            ])
            Z([
                [7],
                [3, 'verifyShow']
            ])
            Z([3, 'verifyClosed'])
            Z([3, 'placeOrder'])
            Z([3, 'verifyRefresh'])
            Z([
                [7],
                [3, 'verifyData']
            ])
            Z([
                [7],
                [3, 'loadCaptcha']
            ])
            Z([3, 'captchaClose'])
            Z([3, 'captchaError'])
            Z([3, 'captchaSuccess'])
            Z([
                [7],
                [3, 'captchaId']
            ])
            Z([1, true])
            Z([3, 'captcha'])
            Z([
                [7],
                [3, 'mask']
            ])
            Z([1, false])
            Z([
                [7],
                [3, 'payShow']
            ])
            Z([3, 'onClose'])
            Z([
                [7],
                [3, 'orderData']
            ])
            Z([
                [7],
                [3, 'dialogShow']
            ])
            Z(z[15])
            Z([
                [7],
                [3, 'childTip']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
            Z([3, 'van-toast'])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_10);
        return __WXML_GLOBAL__.ops_cached.$gwx0_10
    }

    function gz$gwx0_11() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_11) return __WXML_GLOBAL__.ops_cached.$gwx0_11
        __WXML_GLOBAL__.ops_cached.$gwx0_11 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'fillInfo safe-page'])
            Z([
                [2, '>'],
                [
                    [6],
                    [
                        [7],
                        [3, 'ticketList']
                    ],
                    [3, 'length']
                ],
                [1, 0]
            ])
            Z([3, 'addPerson'])
            Z([3, 'clickContact'])
            Z([3, 'delPerson'])
            Z([3, 'inputCardId'])
            Z([3, 'inputName'])
            Z([3, 'ocrInput'])
            Z([3, 'pickCardType'])
            Z([3, 'ticketChange'])
            Z([
                [7],
                [3, 'cardTypeList']
            ])
            Z([
                [7],
                [3, 'contactList']
            ])
            Z([
                [6],
                [
                    [7],
                    [3, 'hallSetting']
                ],
                [3, 'maxPerson']
            ])
            Z([
                [7],
                [3, 'tableData']
            ])
            Z([
                [7],
                [3, 'dialogShow']
            ])
            Z([1, false])
            Z([
                [7],
                [3, 'ticketTip']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
            Z([3, 'van-toast'])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_11);
        return __WXML_GLOBAL__.ops_cached.$gwx0_11
    }

    function gz$gwx0_12() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_12) return __WXML_GLOBAL__.ops_cached.$gwx0_12
        __WXML_GLOBAL__.ops_cached.$gwx0_12 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'skeleton'])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_12);
        return __WXML_GLOBAL__.ops_cached.$gwx0_12
    }

    function gz$gwx0_13() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_13) return __WXML_GLOBAL__.ops_cached.$gwx0_13
        __WXML_GLOBAL__.ops_cached.$gwx0_13 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([
                [7],
                [3, 'loading']
            ])
            Z([3, 'skeleton'])
            Z([3, 'container safe-page'])
            Z([3, 'white'])
            Z([
                [7],
                [3, 'isShowBtn']
            ])
            Z([3, 'top-box'])
            Z([
                [2, '=='],
                [
                    [7],
                    [3, 'unBindbutton']
                ],
                [1, 1]
            ])
            Z([
                [2, '&&'],
                [
                    [7],
                    [3, 'isLogin']
                ],
                [
                    [6],
                    [
                        [7],
                        [3, 'realNameInfo']
                    ],
                    [3, 'bindRealName']
                ]
            ])
            Z(z[4])
            Z([
                [2, '||'],
                [
                    [2, '!'],
                    [
                        [7],
                        [3, 'isLogin']
                    ]
                ],
                [
                    [2, '!'],
                    [
                        [6],
                        [
                            [7],
                            [3, 'realNameInfo']
                        ],
                        [3, 'bindRealName']
                    ]
                ]
            ])
            Z([3, 'Tipsbox'])
            Z([
                [6],
                [
                    [7],
                    [3, 'realNamePageVO']
                ],
                [3, 'n']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
            Z([
                [7],
                [3, 'isShowAllTips']
            ])
            Z([3, 'notice'])
            Z([
                [7],
                [3, 'secretkey']
            ])
            Z([
                [7],
                [3, 'scancode_subscribe_tips']
            ])
            Z([3, 'index'])
            Z([
                [6],
                [
                    [7],
                    [3, 'item']
                ],
                [3, 'parameterDescription']
            ])
            Z(z[12])
            Z([
                [6],
                [
                    [7],
                    [3, 'realNamePageVO']
                ],
                [3, 's']
            ])
            Z(z[12])
            Z([
                [7],
                [3, 'dialogShow']
            ])
            Z([3, 'next'])
            Z([3, '我知道了'])
            Z(z[24])
            Z([
                [2, '?:'],
                [
                    [7],
                    [3, 'secretkey']
                ],
                [
                    [7],
                    [3, 'scancode_notice_for_booking']
                ],
                [
                    [6],
                    [
                        [7],
                        [3, 'realNamePageVO']
                    ],
                    [3, 's']
                ]
            ])
            Z([3, '3'])
            Z([3, '观众预约须知'])
            Z([3, 'van-toast'])
            Z([
                [7],
                [3, 'showNeedRealDialog']
            ])
            Z([1, false])
            Z([3, 'unbindDialog'])
            Z([
                [7],
                [3, 'showCancelBindDialog']
            ])
            Z(z[31])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_13);
        return __WXML_GLOBAL__.ops_cached.$gwx0_13
    }

    function gz$gwx0_14() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_14) return __WXML_GLOBAL__.ops_cached.$gwx0_14
        __WXML_GLOBAL__.ops_cached.$gwx0_14 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'skeleton'])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_14);
        return __WXML_GLOBAL__.ops_cached.$gwx0_14
    }

    function gz$gwx0_15() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_15) return __WXML_GLOBAL__.ops_cached.$gwx0_15
        __WXML_GLOBAL__.ops_cached.$gwx0_15 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([
                [7],
                [3, 'loading']
            ])
            Z([3, 'skeleton'])
            Z([3, 'container safe-page'])
            Z([
                [2, '>'],
                [
                    [6],
                    [
                        [7],
                        [3, 'announcementList']
                    ],
                    [3, 'length']
                ],
                [1, 0]
            ])
            Z([
                [2, '&&'],
                [
                    [7],
                    [3, 'calendarShow']
                ],
                [
                    [6],
                    [
                        [7],
                        [3, 'hall']
                    ],
                    [3, 'status']
                ]
            ])
            Z([3, 'changeDialogTips'])
            Z([3, 'changeTipsShow'])
            Z([
                [7],
                [3, 'calendarData']
            ])
            Z([
                [7],
                [3, 'isShowCalandar']
            ])
            Z([
                [7],
                [3, 'secretkey']
            ])
            Z([
                [2, '!'],
                [
                    [6],
                    [
                        [7],
                        [3, 'hall']
                    ],
                    [3, 'status']
                ]
            ])
            Z([
                [7],
                [3, 'isShowAllTips']
            ])
            Z([
                [7],
                [3, 'noticeList']
            ])
            Z([3, 'index'])
            Z([
                [6],
                [
                    [7],
                    [3, 'item']
                ],
                [3, 'parameterDescription']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
            Z([
                [7],
                [3, 'dialogShow']
            ])
            Z([3, 'next'])
            Z([3, '我已阅读并同意'])
            Z([3, '请滑动查看全部内容'])
            Z([
                [2, '?:'],
                [
                    [7],
                    [3, 'secretkey']
                ],
                [
                    [7],
                    [3, 'noticeText']
                ],
                [
                    [7],
                    [3, 'noticeText']
                ]
            ])
            Z([3, '观众预约须知'])
            Z([
                [7],
                [3, 'orderDialogShow']
            ])
            Z([1, false])
            Z([3, 'van-toast'])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_15);
        return __WXML_GLOBAL__.ops_cached.$gwx0_15
    }

    function gz$gwx0_16() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_16) return __WXML_GLOBAL__.ops_cached.$gwx0_16
        __WXML_GLOBAL__.ops_cached.$gwx0_16 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'container border_top'])
            Z([3, 'white'])
            Z([3, 'box'])
            Z([
                [7],
                [3, 'realNameList']
            ])
            Z([3, 'chooseWay'])
            Z([a, [3, 'way-item '],
                [
                    [2, '?:'],
                    [
                        [2, '=='],
                        [
                            [6],
                            [
                                [7],
                                [3, 'form']
                            ],
                            [3, 'platform']
                        ],
                        [
                            [6],
                            [
                                [7],
                                [3, 'item']
                            ],
                            [3, 'type']
                        ]
                    ],
                    [1, 'active'],
                    [1, '']
                ]
            ])
            Z([
                [7],
                [3, 'item']
            ])
            Z([
                [2, '=='],
                [
                    [6],
                    [
                        [7],
                        [3, 'item']
                    ],
                    [3, 'type']
                ],
                [1, 4]
            ])
            Z([
                [2, '=='],
                [
                    [6],
                    [
                        [7],
                        [3, 'item']
                    ],
                    [3, 'type']
                ],
                [1, 2]
            ])
            Z([
                [7],
                [3, 'cardTypeList']
            ])
            Z([3, 'bottom_tips'])
            Z([
                [6],
                [
                    [7],
                    [3, 'bottom_tips']
                ],
                [3, 'parameterDescription']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
            Z([
                [7],
                [3, 'realTips']
            ])
            Z([3, 'content'])
            Z(z[13])
            Z(z[12])
            Z([
                [7],
                [3, 'showSuccessDialog']
            ])
            Z([1, false])
            Z([
                [7],
                [3, 'beforCloseDialog']
            ])
            Z([1, true])
            Z([
                [7],
                [3, 'showRepeatDialog']
            ])
            Z(z[18])
            Z([
                [7],
                [3, 'reasonOfBind']
            ])
            Z(z[12])
            Z([3, 'van-toast'])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_16);
        return __WXML_GLOBAL__.ops_cached.$gwx0_16
    }

    function gz$gwx0_17() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_17) return __WXML_GLOBAL__.ops_cached.$gwx0_17
        __WXML_GLOBAL__.ops_cached.$gwx0_17 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
        })(__WXML_GLOBAL__.ops_cached.$gwx0_17);
        return __WXML_GLOBAL__.ops_cached.$gwx0_17
    }

    function gz$gwx0_18() {
        if (__WXML_GLOBAL__.ops_cached.$gwx0_18) return __WXML_GLOBAL__.ops_cached.$gwx0_18
        __WXML_GLOBAL__.ops_cached.$gwx0_18 = [];
        (function(z) {
            var a = 11;

            function Z(ops) {
                z.push(ops)
            }
            Z([3, 'success'])
            Z([
                [7],
                [3, 'tips']
            ])
            Z([
                [7],
                [3, 'base_url']
            ])
            Z([
                [2, '!'],
                [
                    [7],
                    [3, 'secretkey']
                ]
            ])
            Z([3, 'van-toast'])
        })(__WXML_GLOBAL__.ops_cached.$gwx0_18);
        return __WXML_GLOBAL__.ops_cached.$gwx0_18
    }
    __WXML_GLOBAL__.ops_set.$gwx0 = z;
    __WXML_GLOBAL__.ops_init.$gwx0 = true;
    var nv_require = function() {
        var nnm = {};
        var nom = {};
        return function(n) {
            if (n[0] === 'p' && n[1] === '_' && f_[n.slice(2)]) return f_[n.slice(2)];
            return function() {
                if (!nnm[n]) return undefined;
                try {
                    if (!nom[n]) nom[n] = nnm[n]();
                    return nom[n];
                } catch (e) {
                    e.message = e.message.replace(/nv_/g, '');
                    var tmp = e.stack.substring(0, e.stack.lastIndexOf(n));
                    e.stack = tmp.substring(0, tmp.lastIndexOf('\n'));
                    e.stack = e.stack.replace(/\snv_/g, ' ');
                    e.stack = $gstack(e.stack);
                    e.stack += '\n    at ' + n.substring(2);
                    console.error(e);
                }
            }
        }
    }()
    var x = ['./subPages/ticket/components/bottomBtn/index.wxml', './subPages/ticket/components/calendar/index.wxml', './subPages/ticket/components/custom/custom.wxml', './subPages/ticket/components/dialog/index.wxml', './subPages/ticket/components/pay/pay.wxml', './subPages/ticket/components/personInfo/personInfo.wxml', './subPages/ticket/components/timeDialog/index.wxml', './subPages/ticket/notice/detail.wxml', './subPages/ticket/notice/list.wxml', './subPages/ticket/personal/confirm/confirm.wxml', './subPages/ticket/personal/fillInfo/fillInfo.wxml', './subPages/ticket/personal/home/index.skeleton.wxml', './subPages/ticket/personal/home/index.wxml', 'index.skeleton.wxml', './subPages/ticket/personal/index/index.skeleton.wxml', './subPages/ticket/personal/index/index.wxml', './subPages/ticket/personal/realName/index.wxml', './subPages/ticket/personal/riskgo/riskgo.wxml', './subPages/ticket/personal/success/success.wxml'];
    d_[x[0]] = {}
    var m0 = function(e, s, r, gg) {
        var z = gz$gwx0_1()
        var oB = _n('slot')
        _(r, oB)
        return r
    }
    e_[x[0]] = {
        f: m0,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[1]] = {}
    var m1 = function(e, s, r, gg) {
        var z = gz$gwx0_2()
        var oD = _v()
        _(r, oD)
        if (_oz(z, 0, e, s, gg)) {
            oD.wxVkey = 1
            var hG = _v()
            _(oD, hG)
            var oH = function(oJ, cI, lK, gg) {
                var tM = _mz(z, 'view', ['bindtap', 2, 'class', 1, 'data-val', 2], [], oJ, cI, gg)
                var eN = _v()
                _(tM, eN)
                if (_oz(z, 5, oJ, cI, gg)) {
                    eN.wxVkey = 1
                }
                var bO = _v()
                _(tM, bO)
                if (_oz(z, 6, oJ, cI, gg)) {
                    bO.wxVkey = 1
                }
                var oP = _v()
                _(tM, oP)
                if (_oz(z, 7, oJ, cI, gg)) {
                    oP.wxVkey = 1
                }
                var xQ = _v()
                _(tM, xQ)
                if (_oz(z, 8, oJ, cI, gg)) {
                    xQ.wxVkey = 1
                }
                var oR = _v()
                _(tM, oR)
                if (_oz(z, 9, oJ, cI, gg)) {
                    oR.wxVkey = 1
                }
                var fS = _v()
                _(tM, fS)
                if (_oz(z, 10, oJ, cI, gg)) {
                    fS.wxVkey = 1
                }
                eN.wxXCkey = 1
                bO.wxXCkey = 1
                oP.wxXCkey = 1
                xQ.wxXCkey = 1
                oR.wxXCkey = 1
                fS.wxXCkey = 1
                _(lK, tM)
                return lK
            }
            hG.wxXCkey = 2
            _2z(z, 1, oH, e, s, gg, hG, 'item', 'index', '')
        }
        var fE = _v()
        _(r, fE)
        if (_oz(z, 11, e, s, gg)) {
            fE.wxVkey = 1
            var cT = _n('view')
            _rz(z, cT, 'class', 12, e, s, gg)
            var hU = _v()
            _(cT, hU)
            if (_oz(z, 13, e, s, gg)) {
                hU.wxVkey = 1
                var oV = _v()
                _(hU, oV)
                var cW = function(lY, oX, aZ, gg) {
                    var e2 = _mz(z, 'view', ['bindtap', 15, 'class', 1, 'data-val', 2], [], lY, oX, gg)
                    var b3 = _v()
                    _(e2, b3)
                    if (_oz(z, 18, lY, oX, gg)) {
                        b3.wxVkey = 1
                    }
                    b3.wxXCkey = 1
                    _(aZ, e2)
                    return aZ
                }
                oV.wxXCkey = 2
                _2z(z, 14, cW, e, s, gg, oV, 'item', 'index', '')
            } else {
                hU.wxVkey = 2
            }
            hU.wxXCkey = 1
            _(fE, cT)
        }
        var o4 = _n('view')
        _rz(z, o4, 'class', 19, e, s, gg)
        var x5 = _v()
        _(o4, x5)
        if (_oz(z, 20, e, s, gg)) {
            x5.wxVkey = 1
            var o6 = _v()
            _(x5, o6)
            var f7 = function(h9, c8, o0, gg) {
                var oBB = _mz(z, 'view', ['bindtap', 22, 'class', 1, 'data-val', 2], [], h9, c8, gg)
                var lCB = _v()
                _(oBB, lCB)
                if (_oz(z, 25, h9, c8, gg)) {
                    lCB.wxVkey = 1
                }
                var aDB = _v()
                _(oBB, aDB)
                if (_oz(z, 26, h9, c8, gg)) {
                    aDB.wxVkey = 1
                }
                var tEB = _v()
                _(oBB, tEB)
                if (_oz(z, 27, h9, c8, gg)) {
                    tEB.wxVkey = 1
                }
                lCB.wxXCkey = 1
                aDB.wxXCkey = 1
                tEB.wxXCkey = 1
                _(o0, oBB)
                return o0
            }
            o6.wxXCkey = 2
            _2z(z, 21, f7, e, s, gg, o6, 'item', 'index', '')
        } else {
            x5.wxVkey = 2
        }
        x5.wxXCkey = 1
        _(r, o4)
        var cF = _v()
        _(r, cF)
        if (_oz(z, 28, e, s, gg)) {
            cF.wxVkey = 1
            var eFB = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 29, 'domain', 1], [], e, s, gg)
            _(cF, eFB)
        }
        oD.wxXCkey = 1
        fE.wxXCkey = 1
        cF.wxXCkey = 1
        cF.wxXCkey = 3
        return r
    }
    e_[x[1]] = {
        f: m1,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[2]] = {}
    var m2 = function(e, s, r, gg) {
        var z = gz$gwx0_3()
        var oHB = _v()
        _(r, oHB)
        if (_oz(z, 0, e, s, gg)) {
            oHB.wxVkey = 1
        }
        var xIB = _v()
        _(r, xIB)
        if (_oz(z, 1, e, s, gg)) {
            xIB.wxVkey = 1
        }
        oHB.wxXCkey = 1
        xIB.wxXCkey = 1
        return r
    }
    e_[x[2]] = {
        f: m2,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[3]] = {}
    var m3 = function(e, s, r, gg) {
        var z = gz$gwx0_4()
        var fKB = _mz(z, 'view', ['catchtouchmove', 0, 'class', 1], [], e, s, gg)
        var cLB = _mz(z, 'van-popup', ['round', -1, 'bind:close', 2, 'show', 1], [], e, s, gg)
        var hMB = _mz(z, 'scroll-view', ['scrollY', -1, 'bindscrolltolower', 4, 'class', 1], [], e, s, gg)
        var oNB = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 6, 'domain', 1], [], e, s, gg)
        _(hMB, oNB)
        _(cLB, hMB)
        _(fKB, cLB)
        _(r, fKB)
        return r
    }
    e_[x[3]] = {
        f: m3,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[4]] = {}
    var m4 = function(e, s, r, gg) {
        var z = gz$gwx0_5()
        var oPB = _mz(z, 'van-popup', ['closeable', -1, 'round', -1, 'bind:close', 0, 'closeIcon', 1, 'closeIconPosition', 1, 'customStyle', 2, 'position', 3, 'show', 4], [], e, s, gg)
        var lQB = _mz(z, 'van-count-down', ['autoStart', 6, 'bind:finish', 1, 'class', 2, 'format', 3, 'time', 4], [], e, s, gg)
        _(oPB, lQB)
        _(r, oPB)
        return r
    }
    e_[x[4]] = {
        f: m4,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[5]] = {}
    var m5 = function(e, s, r, gg) {
        var z = gz$gwx0_6()
        var tSB = _n('view')
        _rz(z, tSB, 'class', 0, e, s, gg)
        var bUB = _n('view')
        _rz(z, bUB, 'class', 1, e, s, gg)
        var oXB = _v()
        _(bUB, oXB)
        var fYB = function(h1B, cZB, o2B, gg) {
            var o4B = _v()
            _(o2B, o4B)
            if (_oz(z, 3, h1B, cZB, gg)) {
                o4B.wxVkey = 1
            }
            o4B.wxXCkey = 1
            return o2B
        }
        oXB.wxXCkey = 2
        _2z(z, 2, fYB, e, s, gg, oXB, 'item', 'index', '')
        var oVB = _v()
        _(bUB, oVB)
        if (_oz(z, 4, e, s, gg)) {
            oVB.wxVkey = 1
        }
        var xWB = _v()
        _(bUB, xWB)
        if (_oz(z, 5, e, s, gg)) {
            xWB.wxVkey = 1
        }
        oVB.wxXCkey = 1
        xWB.wxXCkey = 1
        _(tSB, bUB)
        var l5B = _v()
        _(tSB, l5B)
        var a6B = function(e8B, t7B, b9B, gg) {
            var xAC = _n('view')
            _rz(z, xAC, 'class', 7, e8B, t7B, gg)
            var oBC = _n('view')
            _rz(z, oBC, 'class', 8, e8B, t7B, gg)
            var fCC = _v()
            _(oBC, fCC)
            if (_oz(z, 9, e8B, t7B, gg)) {
                fCC.wxVkey = 1
                var hEC = _mz(z, 'van-uploader', ['bind:after-read', 10, 'data-index', 1, 'deletable', 2, 'previewImage', 3, 'showUpload', 4], [], e8B, t7B, gg)
                _(fCC, hEC)
            }
            var cDC = _v()
            _(oBC, cDC)
            if (_oz(z, 15, e8B, t7B, gg)) {
                cDC.wxVkey = 1
            }
            fCC.wxXCkey = 1
            fCC.wxXCkey = 3
            cDC.wxXCkey = 1
            _(xAC, oBC)
            var oFC = _mz(z, 'van-radio-group', ['bind:change', 16, 'data-index', 1, 'value', 2], [], e8B, t7B, gg)
            var cGC = _v()
            _(oFC, cGC)
            var oHC = function(aJC, lIC, tKC, gg) {
                var bMC = _mz(z, 'van-radio', ['bindtap', 22, 'checkedColor', 1, 'customClass', 2, 'data-person', 3, 'data-ticket', 4, 'disabled', 5, 'name', 6], [], aJC, lIC, gg)
                var oNC = _v()
                _(bMC, oNC)
                if (_oz(z, 29, aJC, lIC, gg)) {
                    oNC.wxVkey = 1
                }
                oNC.wxXCkey = 1
                _(tKC, bMC)
                return tKC
            }
            cGC.wxXCkey = 4
            _2z(z, 21, oHC, e8B, t7B, gg, cGC, 'ticket', 'ticketIndex', '')
            _(xAC, oFC)
            _(b9B, xAC)
            return b9B
        }
        l5B.wxXCkey = 4
        _2z(z, 6, a6B, e, s, gg, l5B, 'item', 'index', '')
        var eTB = _v()
        _(tSB, eTB)
        if (_oz(z, 30, e, s, gg)) {
            eTB.wxVkey = 1
        }
        var xOC = _mz(z, 'van-dialog', ['useSlot', -1, 'show', 31, 'showConfirmButton', 1], [], e, s, gg)
        var oPC = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 33, 'domain', 1], [], e, s, gg)
        _(xOC, oPC)
        _(tSB, xOC)
        eTB.wxXCkey = 1
        _(r, tSB)
        return r
    }
    e_[x[5]] = {
        f: m5,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[6]] = {}
    var m6 = function(e, s, r, gg) {
        var z = gz$gwx0_7()
        var cRC = _mz(z, 'view', ['catchtouchmove', 0, 'class', 1], [], e, s, gg)
        var hSC = _mz(z, 'van-popup', ['round', -1, 'bind:close', 2, 'show', 1], [], e, s, gg)
        var oTC = _mz(z, 'scroll-view', ['scrollY', -1, 'bindscrolltolower', 4, 'class', 1], [], e, s, gg)
        var cUC = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 6, 'domain', 1], [], e, s, gg)
        _(oTC, cUC)
        _(hSC, oTC)
        _(cRC, hSC)
        _(r, cRC)
        return r
    }
    e_[x[6]] = {
        f: m6,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[7]] = {}
    var m7 = function(e, s, r, gg) {
        var z = gz$gwx0_8()
        var lWC = _mz(z, 'mp-html', ['lazyLoad', -1, 'class', 0, 'content', 1, 'domain', 1], [], e, s, gg)
        _(r, lWC)
        return r
    }
    e_[x[7]] = {
        f: m7,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[8]] = {}
    var m8 = function(e, s, r, gg) {
        var z = gz$gwx0_9()
        return r
    }
    e_[x[8]] = {
        f: m8,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[9]] = {}
    var m9 = function(e, s, r, gg) {
        var z = gz$gwx0_10()
        var eZC = _n('view')
        _rz(z, eZC, 'class', 0, e, s, gg)
        var b1C = _v()
        _(eZC, b1C)
        if (_oz(z, 1, e, s, gg)) {
            b1C.wxVkey = 1
        }
        var f5C = _n('bottom-btn')
        _(eZC, f5C)
        var o2C = _v()
        _(eZC, o2C)
        if (_oz(z, 2, e, s, gg)) {
            o2C.wxVkey = 1
            var c6C = _mz(z, 'verify', ['bindverifyClosed', 3, 'bindverifyEnd', 1, 'bindverifyRefresh', 2, 'verifyData', 3], [], e, s, gg)
            _(o2C, c6C)
        }
        var x3C = _v()
        _(eZC, x3C)
        if (_oz(z, 7, e, s, gg)) {
            x3C.wxVkey = 1
            var h7C = _mz(z, 'captcha4', ['bindClose', 8, 'bindError', 1, 'bindSuccess', 2, 'captchaId', 3, 'hideSuccess', 4, 'id', 5, 'mask', 6, 'useNativeButton', 7], [], e, s, gg)
            _(x3C, h7C)
        }
        var o4C = _v()
        _(eZC, o4C)
        if (_oz(z, 16, e, s, gg)) {
            o4C.wxVkey = 1
            var o8C = _mz(z, 'pay', ['bindonClose', 17, 'orderData', 1], [], e, s, gg)
            _(o4C, o8C)
        }
        var c9C = _mz(z, 'van-dialog', ['useSlot', -1, 'show', 19, 'showConfirmButton', 1], [], e, s, gg)
        var o0C = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 21, 'domain', 1], [], e, s, gg)
        _(c9C, o0C)
        _(eZC, c9C)
        b1C.wxXCkey = 1
        o2C.wxXCkey = 1
        o2C.wxXCkey = 3
        x3C.wxXCkey = 1
        x3C.wxXCkey = 3
        o4C.wxXCkey = 1
        o4C.wxXCkey = 3
        _(r, eZC)
        var lAD = _n('van-toast')
        _rz(z, lAD, 'id', 23, e, s, gg)
        _(r, lAD)
        return r
    }
    e_[x[9]] = {
        f: m9,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[10]] = {}
    var m10 = function(e, s, r, gg) {
        var z = gz$gwx0_11()
        var tCD = _n('view')
        _rz(z, tCD, 'class', 0, e, s, gg)
        var eDD = _v()
        _(tCD, eDD)
        if (_oz(z, 1, e, s, gg)) {
            eDD.wxVkey = 1
            var bED = _mz(z, 'person-info', ['bindaddPerson', 2, 'bindclickContact', 1, 'binddelPerson', 2, 'bindinputCardId', 3, 'bindinputName', 4, 'bindocrInput', 5, 'bindpickCardType', 6, 'bindticketChange', 7, 'cardTypeList', 8, 'contactList', 9, 'maxPerson', 10, 'tableData', 11], [], e, s, gg)
            _(eDD, bED)
        }
        var oFD = _n('bottom-btn')
        _(tCD, oFD)
        var xGD = _mz(z, 'van-dialog', ['useSlot', -1, 'show', 14, 'showConfirmButton', 1], [], e, s, gg)
        var oHD = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 16, 'domain', 1], [], e, s, gg)
        _(xGD, oHD)
        _(tCD, xGD)
        var fID = _n('van-toast')
        _rz(z, fID, 'id', 18, e, s, gg)
        _(tCD, fID)
        eDD.wxXCkey = 1
        eDD.wxXCkey = 3
        _(r, tCD)
        return r
    }
    e_[x[10]] = {
        f: m10,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[11]] = {}
    d_[x[11]]["skeleton"] = function(e, s, r, gg) {
        var z = gz$gwx0_12()
        var b = x[11] + ':skeleton'
        r.wxVkey = b
        gg.f = $gdc(f_["./subPages/ticket/personal/home/index.skeleton.wxml"], "", 1)
        if (p_[b]) {
            _wl(b, x[11]);
            return
        }
        p_[b] = true
        try {} catch (err) {
            p_[b] = false
            throw err
        }
        p_[b] = false
        return r
    }
    var m11 = function(e, s, r, gg) {
        var z = gz$gwx0_12()
        return r
    }
    e_[x[11]] = {
        f: m11,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[12]] = {}
    var m12 = function(e, s, r, gg) {
        var z = gz$gwx0_13()
        var oLD = e_[x[12]].i
        _ai(oLD, x[13], e_, x[12], 2, 2)
        var cMD = _v()
        _(r, cMD)
        if (_oz(z, 0, e, s, gg)) {
            cMD.wxVkey = 1
            var oND = _v()
            _(cMD, oND)
            var lOD = _oz(z, 1, e, s, gg)
            var aPD = _gd(x[12], lOD, e_, d_)
            if (aPD) {
                var tQD = {}
                var cur_globalf = gg.f
                oND.wxXCkey = 3
                aPD(tQD, tQD, oND, gg)
                gg.f = cur_globalf
            } else _w(lOD, x[12], 3, 14)
        } else {
            cMD.wxVkey = 2
            var eRD = _n('view')
            _rz(z, eRD, 'class', 2, e, s, gg)
            var xUD = _n('real-custom')
            _rz(z, xUD, 'theme', 3, e, s, gg)
            _(eRD, xUD)
            var bSD = _v()
            _(eRD, bSD)
            if (_oz(z, 4, e, s, gg)) {
                bSD.wxVkey = 1
                var oVD = _n('view')
                _rz(z, oVD, 'class', 5, e, s, gg)
                var fWD = _v()
                _(oVD, fWD)
                if (_oz(z, 6, e, s, gg)) {
                    fWD.wxVkey = 1
                    var hYD = _v()
                    _(fWD, hYD)
                    if (_oz(z, 7, e, s, gg)) {
                        hYD.wxVkey = 1
                    }
                    hYD.wxXCkey = 1
                }
                var cXD = _v()
                _(oVD, cXD)
                if (_oz(z, 8, e, s, gg)) {
                    cXD.wxVkey = 1
                    var oZD = _v()
                    _(cXD, oZD)
                    if (_oz(z, 9, e, s, gg)) {
                        oZD.wxVkey = 1
                    }
                    oZD.wxXCkey = 1
                }
                fWD.wxXCkey = 1
                cXD.wxXCkey = 1
                _(bSD, oVD)
            }
            var c1D = _n('view')
            _rz(z, c1D, 'class', 10, e, s, gg)
            var l3D = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 11, 'domain', 1], [], e, s, gg)
            _(c1D, l3D)
            var o2D = _v()
            _(c1D, o2D)
            if (_oz(z, 13, e, s, gg)) {
                o2D.wxVkey = 1
                var a4D = _n('view')
                _rz(z, a4D, 'class', 14, e, s, gg)
                var t5D = _v()
                _(a4D, t5D)
                if (_oz(z, 15, e, s, gg)) {
                    t5D.wxVkey = 1
                    var e6D = _v()
                    _(t5D, e6D)
                    var b7D = function(x9D, o8D, o0D, gg) {
                        var cBE = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 18, 'domain', 1], [], x9D, o8D, gg)
                        _(o0D, cBE)
                        return o0D
                    }
                    e6D.wxXCkey = 4
                    _2z(z, 16, b7D, e, s, gg, e6D, 'item', 'index', 'index')
                } else {
                    t5D.wxVkey = 2
                    var hCE = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 20, 'domain', 1], [], e, s, gg)
                    _(t5D, hCE)
                }
                t5D.wxXCkey = 1
                t5D.wxXCkey = 3
                t5D.wxXCkey = 3
                _(o2D, a4D)
            }
            o2D.wxXCkey = 1
            o2D.wxXCkey = 3
            _(eRD, c1D)
            var oTD = _v()
            _(eRD, oTD)
            if (_oz(z, 22, e, s, gg)) {
                oTD.wxVkey = 1
                var oDE = _mz(z, 'timeDialog', ['bindclick', 23, 'btnAgree', 1, 'btnText', 2, 'content', 3, 'second', 4, 'title', 5], [], e, s, gg)
                _(oTD, oDE)
            }
            var cEE = _n('van-toast')
            _rz(z, cEE, 'id', 29, e, s, gg)
            _(eRD, cEE)
            bSD.wxXCkey = 1
            oTD.wxXCkey = 1
            oTD.wxXCkey = 3
            _(cMD, eRD)
        }
        var oFE = _n('bottom-btn')
        _(r, oFE)
        var lGE = _mz(z, 'van-dialog', ['useSlot', -1, 'show', 30, 'showConfirmButton', 1], [], e, s, gg)
        _(r, lGE)
        var aHE = _mz(z, 'van-dialog', ['useSlot', -1, 'class', 32, 'show', 1, 'showConfirmButton', 2], [], e, s, gg)
        _(r, aHE)
        cMD.wxXCkey = 1
        cMD.wxXCkey = 3
        oLD.pop()
        return r
    }
    e_[x[12]] = {
        f: m12,
        j: [],
        i: [],
        ti: [x[13]],
        ic: []
    }
    d_[x[14]] = {}
    d_[x[14]]["skeleton"] = function(e, s, r, gg) {
        var z = gz$gwx0_14()
        var b = x[14] + ':skeleton'
        r.wxVkey = b
        gg.f = $gdc(f_["./subPages/ticket/personal/index/index.skeleton.wxml"], "", 1)
        if (p_[b]) {
            _wl(b, x[14]);
            return
        }
        p_[b] = true
        try {} catch (err) {
            p_[b] = false
            throw err
        }
        p_[b] = false
        return r
    }
    var m13 = function(e, s, r, gg) {
        var z = gz$gwx0_14()
        return r
    }
    e_[x[14]] = {
        f: m13,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[15]] = {}
    var m14 = function(e, s, r, gg) {
        var z = gz$gwx0_15()
        var bKE = e_[x[15]].i
        _ai(bKE, x[13], e_, x[15], 2, 2)
        var oLE = _v()
        _(r, oLE)
        if (_oz(z, 0, e, s, gg)) {
            oLE.wxVkey = 1
            var xME = _v()
            _(oLE, xME)
            var oNE = _oz(z, 1, e, s, gg)
            var fOE = _gd(x[15], oNE, e_, d_)
            if (fOE) {
                var cPE = {}
                var cur_globalf = gg.f
                xME.wxXCkey = 3
                fOE(cPE, cPE, xME, gg)
                gg.f = cur_globalf
            } else _w(oNE, x[15], 3, 14)
        } else {
            oLE.wxVkey = 2
            var hQE = _n('view')
            _rz(z, hQE, 'class', 2, e, s, gg)
            var oRE = _v()
            _(hQE, oRE)
            if (_oz(z, 3, e, s, gg)) {
                oRE.wxVkey = 1
            }
            var cSE = _v()
            _(hQE, cSE)
            if (_oz(z, 4, e, s, gg)) {
                cSE.wxVkey = 1
                var tWE = _mz(z, 'calendar', ['bind:changeDialogTips', 5, 'bind:changeTipsShow', 1, 'calendarData', 2, 'isShowCalandar', 3, 'secretkey', 4], [], e, s, gg)
                _(cSE, tWE)
            }
            var oTE = _v()
            _(hQE, oTE)
            if (_oz(z, 10, e, s, gg)) {
                oTE.wxVkey = 1
            }
            var lUE = _v()
            _(hQE, lUE)
            if (_oz(z, 11, e, s, gg)) {
                lUE.wxVkey = 1
                var eXE = _v()
                _(lUE, eXE)
                var bYE = function(x1E, oZE, o2E, gg) {
                    var c4E = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 14, 'domain', 1], [], x1E, oZE, gg)
                    _(o2E, c4E)
                    return o2E
                }
                eXE.wxXCkey = 4
                _2z(z, 12, bYE, e, s, gg, eXE, 'item', 'index', 'index')
            }
            var aVE = _v()
            _(hQE, aVE)
            if (_oz(z, 16, e, s, gg)) {
                aVE.wxVkey = 1
                var h5E = _mz(z, 'dialog', ['bindclick', 17, 'btnAgree', 1, 'btnText', 2, 'content', 3, 'title', 4], [], e, s, gg)
                _(aVE, h5E)
            }
            var o6E = _mz(z, 'van-dialog', ['useSlot', -1, 'show', 22, 'showConfirmButton', 1], [], e, s, gg)
            _(hQE, o6E)
            var c7E = _n('van-toast')
            _rz(z, c7E, 'id', 24, e, s, gg)
            _(hQE, c7E)
            oRE.wxXCkey = 1
            cSE.wxXCkey = 1
            cSE.wxXCkey = 3
            oTE.wxXCkey = 1
            lUE.wxXCkey = 1
            lUE.wxXCkey = 3
            aVE.wxXCkey = 1
            aVE.wxXCkey = 3
            _(oLE, hQE)
        }
        var o8E = _n('bottom-btn')
        _(r, o8E)
        oLE.wxXCkey = 1
        oLE.wxXCkey = 3
        bKE.pop()
        return r
    }
    e_[x[15]] = {
        f: m14,
        j: [],
        i: [],
        ti: [x[13]],
        ic: []
    }
    d_[x[16]] = {}
    var m15 = function(e, s, r, gg) {
        var z = gz$gwx0_16()
        var a0E = _n('view')
        _rz(z, a0E, 'class', 0, e, s, gg)
        var tAF = _n('real-custom')
        _rz(z, tAF, 'theme', 1, e, s, gg)
        _(a0E, tAF)
        var eBF = _n('view')
        _rz(z, eBF, 'class', 2, e, s, gg)
        var oDF = _v()
        _(eBF, oDF)
        var xEF = function(fGF, oFF, cHF, gg) {
            var oJF = _mz(z, 'view', ['bind:tap', 4, 'class', 1, 'data-way', 2], [], fGF, oFF, gg)
            var cKF = _v()
            _(oJF, cKF)
            if (_oz(z, 7, fGF, oFF, gg)) {
                cKF.wxVkey = 1
            }
            var oLF = _v()
            _(oJF, oLF)
            if (_oz(z, 8, fGF, oFF, gg)) {
                oLF.wxVkey = 1
            }
            cKF.wxXCkey = 1
            oLF.wxXCkey = 1
            _(cHF, oJF)
            return cHF
        }
        oDF.wxXCkey = 2
        _2z(z, 3, xEF, e, s, gg, oDF, 'item', 'index', '')
        var bCF = _v()
        _(eBF, bCF)
        if (_oz(z, 9, e, s, gg)) {
            bCF.wxVkey = 1
        }
        var lMF = _n('view')
        _rz(z, lMF, 'class', 10, e, s, gg)
        var tOF = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 11, 'domain', 1], [], e, s, gg)
        _(lMF, tOF)
        var aNF = _v()
        _(lMF, aNF)
        if (_oz(z, 13, e, s, gg)) {
            aNF.wxVkey = 1
            var ePF = _mz(z, 'mp-html', ['lazyLoad', -1, 'class', 14, 'content', 1, 'domain', 2], [], e, s, gg)
            _(aNF, ePF)
        }
        aNF.wxXCkey = 1
        aNF.wxXCkey = 3
        _(eBF, lMF)
        bCF.wxXCkey = 1
        _(a0E, eBF)
        _(r, a0E)
        var bQF = _mz(z, 'van-dialog', ['useSlot', -1, 'show', 17, 'showConfirmButton', 1], [], e, s, gg)
        _(r, bQF)
        var oRF = _mz(z, 'van-dialog', ['useSlot', -1, 'beforeClose', 19, 'closeOnClickOverlay', 1, 'show', 2, 'showConfirmButton', 3], [], e, s, gg)
        var xSF = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 23, 'domain', 1], [], e, s, gg)
        _(oRF, xSF)
        _(r, oRF)
        var oTF = _n('van-toast')
        _rz(z, oTF, 'id', 25, e, s, gg)
        _(r, oTF)
        return r
    }
    e_[x[16]] = {
        f: m15,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[17]] = {}
    var m16 = function(e, s, r, gg) {
        var z = gz$gwx0_17()
        return r
    }
    e_[x[17]] = {
        f: m16,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    d_[x[18]] = {}
    var m17 = function(e, s, r, gg) {
        var z = gz$gwx0_18()
        var hWF = _n('view')
        _rz(z, hWF, 'class', 0, e, s, gg)
        var cYF = _mz(z, 'mp-html', ['lazyLoad', -1, 'content', 1, 'domain', 1], [], e, s, gg)
        _(hWF, cYF)
        var oXF = _v()
        _(hWF, oXF)
        if (_oz(z, 3, e, s, gg)) {
            oXF.wxVkey = 1
        }
        var oZF = _n('van-toast')
        _rz(z, oZF, 'id', 4, e, s, gg)
        _(hWF, oZF)
        oXF.wxXCkey = 1
        _(r, hWF)
        return r
    }
    e_[x[18]] = {
        f: m17,
        j: [],
        i: [],
        ti: [],
        ic: []
    }
    if (path && e_[path]) {
        return function(env, dd, global) {
            $gwxc = 0;
            var root = {
                "tag": "wx-page"
            };
            root.children = []
            var main = e_[path].f
            if (typeof global === "undefined") global = {};
            global.f = $gdc(f_[path], "", 1);
            try {
                main(env, {}, root, global);
                _tsd(root)
            } catch (err) {
                console.log(err)
            }
            return root;
        }
    }
}
__wxAppCode__['subPages/ticket/components/bottomBtn/index.json'] = {
    "component": true,
    "usingComponents": {
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    }
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/components/bottomBtn/index.wxml'] = [$gwx0, './subPages/ticket/components/bottomBtn/index.wxml'];
else __wxAppCode__['subPages/ticket/components/bottomBtn/index.wxml'] = $gwx0('./subPages/ticket/components/bottomBtn/index.wxml');
__wxAppCode__['subPages/ticket/components/calendar/index.json'] = {
    "component": true,
    "usingComponents": {
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    }
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/components/calendar/index.wxml'] = [$gwx0, './subPages/ticket/components/calendar/index.wxml'];
else __wxAppCode__['subPages/ticket/components/calendar/index.wxml'] = $gwx0('./subPages/ticket/components/calendar/index.wxml');
__wxAppCode__['subPages/ticket/components/custom/custom.json'] = {
    "component": true,
    "usingComponents": {
        "van-notice-bar": "../../../../miniprogram_npm/@vant/weapp/notice-bar/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    }
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/components/custom/custom.wxml'] = [$gwx0, './subPages/ticket/components/custom/custom.wxml'];
else __wxAppCode__['subPages/ticket/components/custom/custom.wxml'] = $gwx0('./subPages/ticket/components/custom/custom.wxml');
__wxAppCode__['subPages/ticket/components/dialog/index.json'] = {
    "component": true,
    "usingComponents": {
        "van-popup": "../../../../miniprogram_npm/@vant/weapp/popup/index",
        "rich-text": "/components/htmlParser/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    }
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/components/dialog/index.wxml'] = [$gwx0, './subPages/ticket/components/dialog/index.wxml'];
else __wxAppCode__['subPages/ticket/components/dialog/index.wxml'] = $gwx0('./subPages/ticket/components/dialog/index.wxml');
__wxAppCode__['subPages/ticket/components/pay/pay.json'] = {
    "component": true,
    "usingComponents": {
        "van-popup": "../../../../miniprogram_npm/@vant/weapp/popup/index",
        "van-count-down": "../../../../miniprogram_npm/@vant/weapp/count-down/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    }
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/components/pay/pay.wxml'] = [$gwx0, './subPages/ticket/components/pay/pay.wxml'];
else __wxAppCode__['subPages/ticket/components/pay/pay.wxml'] = $gwx0('./subPages/ticket/components/pay/pay.wxml');
__wxAppCode__['subPages/ticket/components/personInfo/personInfo.json'] = {
    "component": true,
    "usingComponents": {
        "van-radio": "../../../../miniprogram_npm/@vant/weapp/radio/index",
        "van-radio-group": "../../../../miniprogram_npm/@vant/weapp/radio-group/index",
        "van-field": "../../../../miniprogram_npm/@vant/weapp/field/index",
        "van-dialog": "../../../../miniprogram_npm/@vant/weapp/dialog/index",
        "van-uploader": "../../../../miniprogram_npm/@vant/weapp/uploader/index",
        "rich-text": "/components/htmlParser/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    }
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/components/personInfo/personInfo.wxml'] = [$gwx0, './subPages/ticket/components/personInfo/personInfo.wxml'];
else __wxAppCode__['subPages/ticket/components/personInfo/personInfo.wxml'] = $gwx0('./subPages/ticket/components/personInfo/personInfo.wxml');
__wxAppCode__['subPages/ticket/components/timeDialog/index.json'] = {
    "component": true,
    "usingComponents": {
        "van-popup": "../../../../miniprogram_npm/@vant/weapp/popup/index",
        "rich-text": "/components/htmlParser/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    }
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/components/timeDialog/index.wxml'] = [$gwx0, './subPages/ticket/components/timeDialog/index.wxml'];
else __wxAppCode__['subPages/ticket/components/timeDialog/index.wxml'] = $gwx0('./subPages/ticket/components/timeDialog/index.wxml');
__wxAppCode__['subPages/ticket/notice/detail.json'] = {
    "usingComponents": {
        "rich-text": "/components/htmlParser/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    },
    "navigationBarTitleText": "公告详情"
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/notice/detail.wxml'] = [$gwx0, './subPages/ticket/notice/detail.wxml'];
else __wxAppCode__['subPages/ticket/notice/detail.wxml'] = $gwx0('./subPages/ticket/notice/detail.wxml');
__wxAppCode__['subPages/ticket/notice/list.json'] = {
    "usingComponents": {
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    },
    "navigationBarTitleText": "公告通知"
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/notice/list.wxml'] = [$gwx0, './subPages/ticket/notice/list.wxml'];
else __wxAppCode__['subPages/ticket/notice/list.wxml'] = $gwx0('./subPages/ticket/notice/list.wxml');
__wxAppCode__['subPages/ticket/personal/confirm/confirm.json'] = {
    "usingComponents": {
        "bottom-btn": "../../components/bottomBtn/index",
        "verify": "/components/Verify/Verify",
        "pay": "../../components/pay/pay",
        "van-dialog": "../../../../miniprogram_npm/@vant/weapp/dialog/index",
        "rich-text": "/components/htmlParser/index",
        "van-toast": "../../../../miniprogram_npm/@vant/weapp/toast/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "captcha4": "plugin://wx1629d117cf9be937/captcha4"
    },
    "navigationBarTitleText": "预约服务系统"
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/personal/confirm/confirm.wxml'] = [$gwx0, './subPages/ticket/personal/confirm/confirm.wxml'];
else __wxAppCode__['subPages/ticket/personal/confirm/confirm.wxml'] = $gwx0('./subPages/ticket/personal/confirm/confirm.wxml');
__wxAppCode__['subPages/ticket/personal/fillInfo/fillInfo.json'] = {
    "usingComponents": {
        "bottom-btn": "../../components/bottomBtn/index",
        "van-checkbox": "../../../../miniprogram_npm/@vant/weapp/checkbox/index",
        "person-info": "../../components/personInfo/personInfo",
        "van-dialog": "../../../../miniprogram_npm/@vant/weapp/dialog/index",
        "rich-text": "/components/htmlParser/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    },
    "navigationBarTitleText": "预约服务系统"
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/personal/fillInfo/fillInfo.wxml'] = [$gwx0, './subPages/ticket/personal/fillInfo/fillInfo.wxml'];
else __wxAppCode__['subPages/ticket/personal/fillInfo/fillInfo.wxml'] = $gwx0('./subPages/ticket/personal/fillInfo/fillInfo.wxml');
__wxAppCode__['subPages/ticket/personal/home/index.json'] = {
    "usingComponents": {
        "rich-text": "/components/htmlParser/index",
        "van-notice-bar": "../../../../miniprogram_npm/@vant/weapp/notice-bar/index",
        "calendar": "../../components/calendar/index",
        "bottom-btn": "../../components/bottomBtn/index",
        "timeDialog": "../../components/timeDialog/index",
        "van-dialog": "../../../../miniprogram_npm/@vant/weapp/dialog/index",
        "real-custom": "../../components/custom/custom",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    },
    "navigationBarTitleText": "",
    "navigationBarTextStyle": "white",
    "navigationStyle": "custom",
    "styleIsolation": "apply-shared"
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/personal/home/index.wxml'] = [$gwx0, './subPages/ticket/personal/home/index.wxml'];
else __wxAppCode__['subPages/ticket/personal/home/index.wxml'] = $gwx0('./subPages/ticket/personal/home/index.wxml');
__wxAppCode__['subPages/ticket/personal/index/index.json'] = {
    "usingComponents": {
        "rich-text": "/components/htmlParser/index",
        "van-notice-bar": "../../../../miniprogram_npm/@vant/weapp/notice-bar/index",
        "calendar": "../../components/calendar/index",
        "bottom-btn": "../../components/bottomBtn/index",
        "dialog": "../../components/dialog/index",
        "van-dialog": "../../../../miniprogram_npm/@vant/weapp/dialog/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    },
    "navigationBarTitleText": "预约服务系统"
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/personal/index/index.wxml'] = [$gwx0, './subPages/ticket/personal/index/index.wxml'];
else __wxAppCode__['subPages/ticket/personal/index/index.wxml'] = $gwx0('./subPages/ticket/personal/index/index.wxml');
__wxAppCode__['subPages/ticket/personal/realName/index.json'] = {
    "usingComponents": {
        "van-dialog": "../../../../miniprogram_npm/@vant/weapp/dialog/index",
        "real-custom": "../../components/custom/custom",
        "rich-text": "/components/htmlParser/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    },
    "navigationBarTitleText": "",
    "navigationBarTextStyle": "white",
    "navigationStyle": "custom",
    "styleIsolation": "apply-shared"
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/personal/realName/index.wxml'] = [$gwx0, './subPages/ticket/personal/realName/index.wxml'];
else __wxAppCode__['subPages/ticket/personal/realName/index.wxml'] = $gwx0('./subPages/ticket/personal/realName/index.wxml');
__wxAppCode__['subPages/ticket/personal/riskgo/riskgo.json'] = {
    "usingComponents": {
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    }
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/personal/riskgo/riskgo.wxml'] = [$gwx0, './subPages/ticket/personal/riskgo/riskgo.wxml'];
else __wxAppCode__['subPages/ticket/personal/riskgo/riskgo.wxml'] = $gwx0('./subPages/ticket/personal/riskgo/riskgo.wxml');
__wxAppCode__['subPages/ticket/personal/success/success.json'] = {
    "usingComponents": {
        "rich-text": "/components/htmlParser/index",
        "cropImg": "/components/img/cropImg",
        "custom": "/components/custom/custom",
        "customNav": "/components/custom/index",
        "mp-html": "/./miniprogram_npm/mp-html/index",
        "privacy-popup": "/components/privacyPopup/index",
        "van-icon": "/./miniprogram_npm/@vant/weapp/icon/index",
        "van-image": "/./miniprogram_npm/@vant/weapp/image/index",
        "van-toast": "/./miniprogram_npm/@vant/weapp/toast/index"
    },
    "navigationBarTitleText": "预约服务系统"
};
if (__vd_version_info__.delayedGwx) __wxAppCode__['subPages/ticket/personal/success/success.wxml'] = [$gwx0, './subPages/ticket/personal/success/success.wxml'];
else __wxAppCode__['subPages/ticket/personal/success/success.wxml'] = $gwx0('./subPages/ticket/personal/success/success.wxml');

define("subPages/ticket/utils/ValidForeignCard18.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: !0
    }), exports.validParityBit = exports.isValidForeignCard18 = exports.isValidForeignCard15 = exports.getPowerSum15 = exports.getPowerSum = exports.getForeignBirth15 = exports.getCheckCode18 = exports.getAge = void 0;
    var r = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2],
        e = {
            11: "北京",
            12: "天津",
            13: "河北",
            14: "山西",
            15: "内蒙古",
            21: "辽宁",
            22: "吉林",
            23: "黑龙江 ",
            31: "上海",
            32: "江苏",
            33: "浙江",
            34: "安徽",
            35: "福建",
            36: "江西",
            37: "山东",
            41: "河南",
            42: "湖北 ",
            43: "湖南",
            44: "广东",
            45: "广西",
            46: "海南",
            50: "重庆",
            51: "四川",
            52: "贵州",
            53: "云南",
            54: "西藏 ",
            61: "陕西",
            62: "甘肃",
            63: "青海",
            64: "宁夏",
            65: "新疆",
            83: "台湾",
            81: "香港",
            82: "澳门",
            91: "国外 "
        },
        t = [7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3],
        s = {
            A: 10,
            B: 11,
            C: 12,
            D: 13,
            E: 14,
            F: 15,
            G: 16,
            H: 17,
            I: 18,
            J: 19,
            K: 20,
            L: 21,
            M: 22,
            N: 23,
            O: 24,
            P: 25,
            Q: 26,
            R: 27,
            S: 28,
            T: 29,
            U: 30,
            V: 31,
            W: 32,
            X: 33,
            Y: 34,
            Z: 35
        },
        n = (exports.isValidForeignCard18 = function(r) {
            var t = {
                status: !0,
                errtips: ""
            };
            if (18 != r.length) return t.status = !1, t.errtips = "外国人永久居留身份证格式错误", t;
            if ("9" != r.substring(0, 1)) return t.status = !1, t.errtips = "外国人永久居留身份证格式错误", t;
            var s = r.substring(1, 3);
            if (!e[s]) return t.status = !1, t.errtips = "外国人永久居留身份证格式错误", t;
            var a = r.substring(0, 17),
                o = r.charAt(17).toLowerCase();
            if (/^[0-9]*$/i.test(a) && u(n(a.split(""))) == o) {
                t.status = !0, t.errtips = "外国人永久居留身份证格式正确";
                var g = (r.substring(6, 10) + r.substring(10, 12) + r.substring(12, 14)).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"),
                    p = i(g);
                return t.age = p, t
            }
            return t.status = !1, t.errtips = "外国人永久居留身份证格式错误", t
        }, exports.getPowerSum = function(e) {
            var t = 0;
            if (r.length == e.length)
                for (var s = 0; s < e.length; s++) t += parseInt(e[s]) * r[s];
            return t
        }),
        u = exports.getCheckCode18 = function(r) {
            switch (r % 11) {
                case 10:
                    return "2";
                case 9:
                    return "3";
                case 8:
                    return "4";
                case 7:
                    return "5";
                case 6:
                    return "6";
                case 5:
                    return "7";
                case 4:
                    return "8";
                case 3:
                    return "9";
                case 2:
                    return "x";
                case 1:
                    return "0";
                case 0:
                    return "1";
                default:
                    return ""
            }
        },
        i = (exports.isValidForeignCard15 = function(r) {
            var e = {
                status: !1,
                tip: "外国人永久居留身份证格式错误",
                age: null
            };
            if (!/^[a-zA-Z]{3}\d{12}$/.test(r)) return e;
            if (!g(r)) return e;
            var t = a(r),
                s = i(t);
            return e.age = s, e.tip = "外国人永久居留身份证格式正确", e.status = !0, e
        }, exports.getAge = function(r) {
            var e, t = r.split("-"),
                s = t[0],
                n = t[1],
                u = t[2],
                i = new Date,
                a = i.getFullYear(),
                o = i.getMonth() + 1,
                g = i.getDate();
            if (a == s) e = 0;
            else {
                var p = a - s;
                if (p > 0)
                    if (o == n) e = g - u < 0 ? p - 1 : p;
                    else e = o - n < 0 ? p - 1 : p;
                else e = -1
            }
            return e
        }),
        a = exports.getForeignBirth15 = function(r) {
            var e = r.substring(7, 8);
            return (Number(e) >= 0 && Number(e) <= 3 ? "20" + r.substring(7, 13) : "19" + r.substring(7, 13)).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3")
        },
        o = exports.getPowerSum15 = function(r) {
            for (var e = 0, n = [], u = 0; u < r.length; u++)
                if (u < 3) {
                    var i = s[r.substring(u, u + 1)];
                    n.push(i)
                } else n.push(Number(r.substring(u, u + 1)));
            for (var a = 0; a < t.length; a++) e += n[a] * t[a];
            return e
        },
        g = exports.validParityBit = function(r) {
            var e = r.substring(0, 14),
                t = Number(r.substring(14, 15));
            return o(e) % 10 == t
        };
});
define("subPages/ticket/utils/ase.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var e = require("../../../@babel/runtime/helpers/interopRequireDefault").default;
    Object.defineProperty(exports, "__esModule", {
        value: !0
    }), exports.aesEncrypt = function(e) {
        var r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "XwKsGlMcdPMEhR1B",
            a = t.default.enc.Utf8.parse(r),
            u = t.default.enc.Utf8.parse(e),
            n = t.default.AES.encrypt(u, a, {
                mode: t.default.mode.ECB,
                padding: t.default.pad.Pkcs7
            });
        return n.toString()
    }, exports.generateSignature = function(e) {
        var r = t.default.enc.Utf8.parse(data),
            a = t.default.HmacSHA256(r, apiKey),
            u = a.toString(t.default.enc.Hex);
        return u
    };
    var t = e(require("crypto-js"));
});
define("subPages/ticket/utils/check.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: !0
    }), exports.onlyChild = function(a, i) {
        var l = i.split("-"),
            c = e(l, 2),
            o = c[0],
            s = c[1],
            u = 0;
        return a.forEach((function(e) {
            if (1 == e.card_type) {
                var a = (0, r.calcIDCard)(e.card_id || e.certificateNumber, t.globalData.ticketTempData.chooseDate);
                a <= Number(s) && a >= (Number(o) || 0) && ++u
            } else e.isChild && ++u
        })), console.log(a.length, u), a.length === u
    };
    var e = require("../../../@babel/runtime/helpers/slicedToArray"),
        r = require("./utils"),
        t = getApp();
});
define("subPages/ticket/utils/recommend.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: !0
    }), exports.smartRecommendTicketFun = function(c, i, r) {
        console.log("开始推荐票种");
        var o = null,
            n = null,
            l = "0.00",
            d = !1,
            s = !1,
            u = "",
            f = [];
        if ((1 == c || 7 == c) && i && (0, e.checkIdcard)(i).status || 6 == c && i && (0, t.isValidForeignCard18)(i).status)
            for (var g = 0; g < r.length; g++) {
                var k = r[g],
                    m = k.notRecommendPrice,
                    h = k.recommendAgeMin,
                    p = k.recommendAgeMax,
                    D = (k.ticketPool, k.certificateVOS),
                    v = k.canCheck,
                    C = D.findIndex((function(e) {
                        return 1 == e.id || 7 == e.id || 6 == e.id
                    })) >= 0;
                console.log(C);
                var I = 1 == c || 7 == c ? (0, e.calcIDCard)(i, a.globalData.ticketTempData.chooseDate) : (0, e.calcForTdCard)(i, a.globalData.ticketTempData.chooseDate);
                if (v && C && !m && I >= h && I <= p) {
                    d = r[g].child, l = r[g].price, o = r[g].priceId, n = r[g].priceName, r[g].document && (s = !0, u = r[g].document);
                    break
                }
            } else
                for (var b = 0; b < r.length; b++) {
                    var T = r[b].certificateVOS.findIndex((function(e) {
                        return e.id == c
                    })) >= 0;
                    if (r[b].canCheck && T && !r[b].notRecommendPrice && r[b].tourEscort && r[b].ticketPool > 0) {
                        d = r[b].child, l = r[b].price, o = r[b].priceId, n = r[b].priceName;
                        break
                    }
                }
        r.forEach((function(r) {
            for (var o = !1, n = 0; n < r.certificateVOS.length; n++)
                if (console.log(c, i, (0, e.checkIdcard)(i).status), (1 == c || 7 == c) && i && (0, e.checkIdcard)(i).status || 6 == c && i && (0, t.isValidForeignCard18)(i).status) {
                    var l = 1 == c || 7 == c ? (0, e.calcIDCard)(i, a.globalData.ticketTempData.chooseDate) : (0, e.calcForTdCard)(i, a.globalData.ticketTempData.chooseDate);
                    if (console.log(l), console.log(r.certificateVOS[n].id == c, 4 == r.status, l >= r.ageMin, l <= r.ageMax), r.certificateVOS[n].id == c && 4 == r.status && l >= r.ageMin && l <= r.ageMax) {
                        o = !0;
                        break
                    }
                } else if (r.certificateVOS[n].id == c && 4 == r.status) {
                o = !0;
                break
            }
            r.canCheck = !!o, f.push(r)
        }));
        var V = {
            ticketId: o,
            ticketName: n,
            ticketPrice: l,
            isChild: d,
            list: f,
            isShowTips: s,
            tipsText: u
        };
        return console.log(V, "2"), V
    };
    var e = require("./utils"),
        t = require("./ValidForeignCard18"),
        a = getApp();
});
define("subPages/ticket/utils/turingSDK.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var r = require("../../../@babel/runtime/helpers/classCallCheck"),
        e = require("../../../@babel/runtime/helpers/createClass");

    function t() {
        var r = ["y3jLyxrLu2HHzgvY", "z2v0vw5PzM9YBuXVy2f0Aw9U", "zxHPC3rxzwjhte5Vzgu", "B2j0ywLUq2f2yw5gzwf0DxjL", "B2j0ywLUu3LZDgvTsw5MBW", "C2LNBKrHDge", "DxnLuhjVz3jHBq", "i3r1CMLUzY1Yzw5KzxiTD2vIz2W", "D2vIz2WGC3rLBMnPBcbIAxrZoG", "BgLUA1bYB2DYyw0", "z2v0qMvHy29UCW", "yxr0ywnOu2HHzgvY", "B2zMC2v0vw5PzM9YBq", "D2vIz2WGz3jLzw4GyML0CZO", "sxqNCYbQDxn0igeGDgvZDcWG8j+pHIdWN4+fipcFPyCG8j+LIcdWN6wj", "Axnby3rPDMf0zq", "otK5mJmWA2XgsfPQ", "4lA04lA74lEt4lAA4lEk4lEc4lAR4lA64lAA4lEkioc2Toc2Uoc2Q+c3KIWG8j+qKIdWN6AnipcFPQCG8j+MPsdWN6AyipcFKkG", "mZK4mdi2ofH2q2jhvq", "yxr0CMLIDxrLihzLyZiGyxr0CLzLCNrLEdT2yxj5Aw5NihzLyZiGDMfYEwLUvgv4q29VCMrPBMf0ztT1BMLMB3jTihzLyZiGDw5PzM9YBu9MzNnLDdT2B2LKig1HAw4OkxT2yxj5Aw5uzxHdB29YzgLUyxrLpwf0Dhjwzxj0zxGRDw5PzM9YBu9MzNnLDdTNBf9qB3nPDgLVBJ12zwm0kgf0Dhjwzxj0zxGSmcWXktT9", "vKvsvevyx1niqurfuG", "y2f0y2G", "yNvMzMvYrgf0yq", "DMvYDgv4qxr0CMLIug9PBNrLCG", "4lMb4lIe4lMi4lIx4lIu4lIQ4lIT4lIAlcdWN5gcipcFKymG8j+rHcdWN5EIipcFKyuG8j+MTW", "B2j0ywLUvxnLCKLUzM8", "r1jfru5FqKLuuW", "tufyx0nvqKvFtufqx1rfwfrvuKvFu0LArq", "CgfNzq", "uKvex0jjvfm", "rKXpqvq", "B2j0ywLUqMvHy29UCW", "z2v0u0rlsw5MBW", "zxjYB3i", "B2j0ywLUv2vIr0Xgzwf0DxjL", "C2HHzgvYu291CMnL", "y2fUDMfZ", "yMLUzej1zMzLCG", "revqveHFqKLuuW", "Dg9eyxrHvvjm", "tufyx0zsquDnru5ux1vosuzpuK1FvKvdve9suW", "D2vIz2WGC2HHzgLUzYbSyw5NDwfNzsb2zxjZAw9UoG", "ndiXndi4sNPWy3LH", "DhvYAw5NlwnHBNzHCW", "ChvZAa", "y29TCgLSzvnOywrLCG", "D2vIz2WGBwf4igzYywDTzw50ihvUAwzVCM0GDMvJDg9YCZO", "8j+zIYdWN5MmipcFMy0G8j+zJIdWN5MhipcFMy8", "z2v0q29UDgv4Def0DhjPyNv0zxm", "zMLUAxnO", "y2XLyxi", "uKvorevsrvi", "rLjbr01ftLrFu0Hbrevs", "vfjjqu5htevFu1rssva", "Dw5PzM9YBu9MzNnLDa", "ywXS", "CMvZ", "B2j0ywLUq29UBMvJDgvKv2LMAq", "ywn0AxzHDgvtAwDU", "Aw5PDa", "D2vIz2WGDMvUzg9YoG", "yxr0CLzLCNrLEa", "nJaYntaYD2HJqwrK", "ig9IDgfPBIb0Aw1LB3v0", "D2vIz2WGBwf4ignVBwjPBMvKihrLEhr1CMuGAw1Hz2uGDw5PDhm6", "ywXWAgfIzxrPyW", "2yhzGTI3inUm2QKG2klySTMf2kFBJnI0lcdWN42hipcFJzeG8j+nKIdWN42tipcFPz0", "D3jHCfbYB21PC2u", "zM9UDa", "DgHLBG", "zxjYtxnN", "DMvYDgv4ug9Zqxr0CMLI", "z2v0qxr0CMLItg9JyxrPB24", "D2vIz2WGDMvYC2LVBJO", "iZa2oq", "0jFsR9cZ0y3rJDgainc7ingc0yprGngi0lJqU9gclcdWN46dipcFJOeG8j+oGIdWN46iipcFJOKG8j+oIG", "CMv0", "AM9PBG", "ngPXzMzAta", "D2vIz2WGyMX1zsbIAxrZoG", "8j+yHYdWN5IilIdWN5IpipcFPkmG8j+KQsdWN6sQipcFPBmU", "y3jLyxrLq2fUDMfZq29UDgv4Da", "tufyx1zbuLLjtKDFvKvdve9suW", "zxHWB3j0CW", "D2vIz2WGywXWAgeGyML0CZO", "y2XLyxjdB2XVCG", "y2fSBa", "DhvYAw5Nq29Yzq", "mtuYndm3nZbXu2vht3i", "D2vIz2WGBwf4ihzLCNrLEcbHDhrYAwjZoG", "mtfWEcbZyw5ZlxnLCMLM", "z2v0vgLJA2v0", "C2XPy2u", "tufyx1rfwfrvuKvFsu1br0vFvu5jvfm", "mtvTvNDcyNi", "z2v0vgLTzq", "vMv0W6TTig5QW6SGChjVDSoRlcdWN5IfipcFMiyG8j+yII4G8j+yJIa", "zw5HyMXLvMvYDgv4qxr0CMLIqxjYyxK", "BgvUz3rO", "zhjHD0fYCMf5CW", "Dw5PzM9YBtjM", "D2vIz2WGBwf4ihrLEhr1CMuGC2L6ztO", "z2v0ugfYyw1LDgvY", "8j+qNIdWN5cCipcFLBCG8j+vUcdWN6AcipcFPPCG8j+MNYa", "z2v0rgv2AwnLsw5MBW", "D2vIz2WGzgvWDgGGyML0CZO", "4kIS4kMX4kI4iocOH+cPSEcOLsdGQkRGQy3GQldGQydGQjBGQl/GQiySipcFKQOG8j+xSIdWN5sLipcFKQeG8j+sQq", "D2vIz2WGBwf4ihzHCNLPBMCGDMvJDg9YCZO", "yw50AwfSAwfZ", "C3rHCNrxAwzP", "tufyx1zfuLrfwf9bvfrssujt", "zxH0zw5ZAw9UCW", "zgf0ytO", "qKXvrv9csvrt", "u0HbreLor19mqu5hvufhrv9wrvjtsu9o", "C2vSzwn0", "zhjHDW", "z2v0q29UDgv4Da", "B2j0ywLUrMLUz2vYuhjPBNrgzwf0DxjL", "z2v0u3vWCg9YDgvKrxH0zw5ZAw9UCW", "6RE464oLio2fJoYkPo2kUcWG8j+tUIdWN5o7ipcFK74G8j+tOsdWN5IbipcFMiaG8j+yGI4", "u1rbveLdx0rsqvC", "Bg9JywXLq29TCgfYzq", "BNvTsxrLBxm", "y3jLyxrLuhjVz3jHBq", "y2fUDMfZr2v0sw1Hz2veyxrH", "Dgv4DejHC2vSAw5L", "5lUf5lUf5PIV5lIa5lIQ5Rwl6k+vlcdWN4YJipcFJj4G4PUfipcFJkqG8j+mPsdIM7e", "BM9Kzq", "qvjsqvLFqLvgrKvs", "mZGWnda0nwfYyMTqAG", "AxrLBvnPEMu", "ywXWAge", "z2v0rgv2AwnLvg9Rzw5wmG", "D2vIz2WGBwf4ihrLEhr1CMuGAw1Hz2uGDw5PDhm6", "B2j0ywLUrMvHDhvYzq", "tufyx1zfuLrfwf9urvHuvvjfx0LnquDfx1vosvrt", "EwvZ", "C29YDa", "y3jLyxrLu2vSzwn0B3jrDwvYEq", "z2v0u3LZDgvTsw5MBW", "vKvsu0LptG", "zxHLyW", "mtG1mJa4D2nLyM9Q", "mZi0v2Thq1Pt", "D2vIz2WGCMvUzgvYzxi6"];
        return (t = function() {
            return r
        })()
    }! function(r, e) {
        for (var v = u, n = t();;) try {
            if (648010 === -parseInt(v(610)) / 1 + parseInt(v(526)) / 2 * (-parseInt(v(490)) / 3) + parseInt(v(612)) / 4 + parseInt(v(542)) / 5 * (-parseInt(v(510)) / 6) + parseInt(v(578)) / 7 + -parseInt(v(591)) / 8 * (parseInt(v(592)) / 9) + parseInt(v(536)) / 10) break;
            n.push(n.shift())
        } catch (r) {
            n.push(n.shift())
        }
    }();
    var v = {
            "./miniprogram/module/turingSDK.js": function(t) {
                var v = u,
                    n = requirePlugin(v(535)),
                    i = v(491),
                    a = function(t, n, a, c, f, o, z, s, y) {
                        function w(e) {
                            r(this, w), this[v(476)] = e
                        }
                        return e(w, [{
                            key: "existWebGLNode",
                            value: function() {
                                var r = this;
                                return new Promise((function(e) {
                                    var t = u;
                                    (new Date)[t(543)]();
                                    var v = !0;
                                    try {
                                        var n = setTimeout((function() {
                                                clearTimeout(n), e(v)
                                            }), 800),
                                            i = wx[t(587)]();
                                        r[t(476)] && (i = wx.createSelectorQuery().in(r.page)), i[t(563)](t(601)).node((function(r) {
                                            clearTimeout(n), null != r && null != r || (v = !1), e(v)
                                        }))[t(590)]()
                                    } catch (r) {
                                        e(v)
                                    }
                                }))
                            }
                        }, {
                            key: t,
                            value: function(r, e, t) {
                                var n = v;
                                try {
                                    var a = wx[n(529)](i);
                                    t && (a = wx.createCanvasContext(i, t)), a.fontSize = 10, a[n(574)] = n(513), a.fillStyle = n(522), a[n(516)] = n(538);
                                    for (var c = [n(608), "ただのテスト, 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘", n(575), n(568), " 🤠 🤡 🤑 🤓 🤖", n(544), n(528), "بس ایک امتحان, 🤦 🤷 🙅 🙆", n(495), n(472), n(554), n(514), n(611), n(523), n(551)], f = 0; f < c[n(546)]; f++) a.fillText(c[f], 5, 13.3333 * (f + 1));
                                    a[n(564)](!1, (function() {
                                        var v = {
                                            canvasId: i,
                                            x: 0,
                                            y: 0,
                                            width: 300,
                                            height: 300,
                                            success: r,
                                            fail: function(r) {
                                                var t = u,
                                                    v = {};
                                                v[t(524)] = -1008, v[t(504)] = r[t(518)], e(v)
                                            }
                                        };
                                        t ? wx[n(573)](v, t) : wx.canvasGetImageData(v)
                                    }))
                                } catch (r) {
                                    var o = {};
                                    o[n(524)] = -1006, o.res = r, e(o)
                                }
                            }
                        }, {
                            key: n,
                            value: function(r, e, t) {
                                var n = v,
                                    i = wx[n(587)]();
                                t && (i = wx[n(587)]().in(t)), i[n(563)](n(601))[n(576)]().exec((function(t) {
                                    var v = n;
                                    try {
                                        var i = {};
                                        i[v(580)] = !1, i.preserveDrawingBuffer = !0;
                                        var u = t[0][v(576)][v(565)]("webgl", i),
                                            a = "",
                                            c = u.createBuffer();
                                        u[v(485)](u[v(577)], c);
                                        var f = new Float32Array([-.2, -.9, 0, .4, -.26, 0, 0, .732134444, 0]);
                                        u[v(616)](u[v(577)], f, u[v(569)]), c[v(579)] = 3, c.numItems = 3;
                                        var o = u[v(572)](),
                                            z = u[v(594)](u[v(614)]);
                                        u[v(483)](z, v(613)), u[v(493)](z);
                                        var s = u.createShader(u[v(500)]);
                                        u[v(483)](s, "precision mediump float;varying vec2 varyinTexCoordinate;void main() {gl_FragColor=vec4(varyinTexCoordinate,0,1);}"), u[v(493)](s), u[v(605)](o, z), u[v(605)](o, s), u[v(603)](o), u[v(600)](o), o[v(519)] = u[v(520)](o, v(509)), o.offsetUniform = u[v(595)](o, v(502)), u[v(545)](o[v(519)]), u[v(617)](o[v(519)], c.itemSize, u[v(478)], !1, 0, 0), u[v(548)](o[v(606)], 1, 1), u[v(533)](0, 0, 0, 0), u[v(498)](u.COLOR_BUFFER_BIT), u[v(547)](u[v(501)], 0, c[v(571)]), u[v(497)]();
                                        var y = [],
                                            w = (u[v(567)]() || [])[v(586)]((function(r, e) {
                                                return r[v(570)](e)
                                            }));
                                        u[v(484)][v(487)] && y[v(492)](v(560) + u[v(484)][v(487)]()), y.push(v(559) + w[v(525)](";")), y.push(v(532) + u[v(550)](u.ALPHA_BITS)), y[v(492)]((u[v(496)]()[v(556)], v(585))), y[v(492)](v(527) + u.getParameter(u[v(561)])), y[v(492)](v(553) + u.getParameter(u[v(486)])), y[v(492)](v(607) + u[v(550)](u[v(474)])), y.push(v(512) + u.getParameter(u.MAX_COMBINED_TEXTURE_IMAGE_UNITS)), y[v(492)]("webgl max cube map texture size:" + u[v(550)](u[v(475)])), y.push(v(494) + u[v(550)](u[v(488)])), y[v(492)]("webgl max render buffer size:" + u[v(550)](u.MAX_RENDERBUFFER_SIZE)), y[v(492)](v(582) + u[v(550)](u[v(541)])), y[v(492)](v(549) + u[v(550)](u.MAX_TEXTURE_SIZE)), y[v(492)](v(555) + u[v(550)](u[v(530)])), y.push(v(537) + u.getParameter(u[v(558)])), y[v(492)]("webgl max vertex texture image units:" + u[v(550)](u[v(584)])), y[v(492)]("webgl max vertex uniform vectors:" + u[v(550)](u.MAX_VERTEX_UNIFORM_VECTORS)), y[v(492)]("webgl red bits:" + u[v(550)](u[v(477)])), y[v(492)](v(593), u.getParameter(u[v(499)])), y[v(492)](v(489) + u.getParameter(u[v(562)])), y.push(v(602) + u[v(550)](u.STENCIL_BITS)), y[v(492)](v(508) + u[v(550)](u.VENDOR)), y[v(492)](v(521) + u[v(550)](u[v(589)]));
                                        var L = JSON.stringify(y);
                                        r(a += L)
                                    } catch (r) {
                                        var g = {};
                                        g[v(524)] = -1007, g[v(504)] = r, e(g)
                                    }
                                }))
                            }
                        }, {
                            key: a,
                            value: function(r, e) {
                                r()
                            }
                        }, {
                            key: c,
                            value: function(r, e) {
                                r()
                            }
                        }, {
                            key: f,
                            value: function(r, e) {
                                wx[v(588)]({
                                    success: r,
                                    fail: function() {
                                        r({})
                                    }
                                })
                            }
                        }, {
                            key: o,
                            value: function(r, e) {
                                wx[v(604)]({
                                    success: r,
                                    fail: function() {
                                        r()
                                    }
                                })
                            }
                        }, {
                            key: z,
                            value: function(r, e) {
                                wx[v(557)]({
                                    success: function(e) {
                                        wx.getConnectedWifi({
                                            success: r,
                                            fail: function(e) {
                                                r()
                                            }
                                        })
                                    },
                                    fail: function(e) {
                                        r()
                                    }
                                })
                            }
                        }, {
                            key: s,
                            value: function() {
                                var r = v,
                                    e = arguments[0],
                                    t = arguments[1],
                                    n = [][r(540)][r(534)](arguments, 1, arguments[r(546)]),
                                    i = this;
                                return new Promise((function(v, a) {
                                    var c = r;
                                    try {
                                        var f = setTimeout((function() {
                                            var r = u,
                                                t = {
                                                    ret: -1007
                                                };
                                            t[r(504)] = e + r(511), f = null, v(t)
                                        }), 5e3);
                                        t.apply(this, [function(r) {
                                            var e = {};
                                            e[u(524)] = 0, e.res = r, f && (clearTimeout(f), v(e))
                                        }, function(r) {
                                            var e = u,
                                                t = {};
                                            t[e(524)] = r[e(524)], t[e(504)] = r[e(504)], v(t)
                                        }, i.page].concat(n))
                                    } catch (r) {
                                        var o = {};
                                        o[c(524)] = -1005, o[c(504)] = r, v(o)
                                    }
                                }))
                            }
                        }, {
                            key: y,
                            value: function(r) {
                                var e = v;
                                try {
                                    Promise[e(503)]([this.wrapPromise(1, this[e(598)]), this.wrapPromise(2, this.obtainConnectedWifi), this[e(515)](3, this.obtainBeacons), this[e(515)](4, this[e(597)]), this[e(515)](5, this[e(482)]), this[e(515)](6, this[e(566)]), this.wrapPromise(7, this[e(473)])])[e(517)]((function(e) {
                                        r(e)
                                    }))[e(615)]((function(r) {}))
                                } catch (v) {
                                    var t = {};
                                    t[e(524)] = -1004, t[e(481)] = v, r([t])
                                }
                            }
                        }]), w
                    }(v(597), v(482), v(566), v(473), v(598), v(479), v(505), v(515), v(583));
                t[v(531)] = {
                    init: function(r, e) {
                        var t = v;
                        try {
                            var i = new a(r[t(476)]);
                            n[t(507)]({
                                obtainFeature: function(r, e) {
                                    i[t(583)](r, e)
                                },
                                existWebGLNode: function() {
                                    return i[t(596)]()
                                }
                            }, r, e)
                        } catch (r) {}
                    },
                    getTicket: function(r) {
                        var e = v;
                        try {
                            n[e(539)](r)
                        } catch (r) {}
                    },
                    getDeviceToken: function(r) {
                        try {
                            n.getDeviceToken(r)
                        } catch (r) {}
                    },
                    getDeviceTokenV2: function(r) {
                        var e = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1],
                            t = v;
                        try {
                            n[t(581)](r, e)
                        } catch (r) {}
                    },
                    getDeviceTokenX: function(r) {
                        var e = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
                        try {
                            n.getDeviceTokenX(r, e)
                        } catch (r) {}
                    },
                    getSDKInfo: function() {
                        return n[v(480)]()
                    },
                    getDeviceInfo: function() {
                        return n[v(552)]()
                    },
                    activateSign: function(r) {
                        return n[v(506)](r)
                    },
                    signData: function(r) {
                        return n[v(599)](r)
                    },
                    isActivate: function() {
                        return n[v(609)]()
                    }
                }
            }
        },
        n = {},
        i = function r(e) {
            var t = u,
                i = n[e];
            if (void 0 !== i) return i[t(531)];
            var a = {
                    exports: {}
                },
                c = n[e] = a;
            return v[e](c, c.exports, r), c[t(531)]
        }("./miniprogram/module/turingSDK.js");

    function u(r, e) {
        var v = t();
        return (u = function(e, t) {
            var n = v[e -= 472];
            if (void 0 === u.jPYOKz) {
                var i = function(r) {
                    for (var e, t, v = "", n = "", i = 0, u = 0; t = r.charAt(u++); ~t && (e = i % 4 ? 64 * e + t : t, i++ % 4) ? v += String.fromCharCode(255 & e >> (-2 * i & 6)) : 0) t = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=".indexOf(t);
                    for (var a = 0, c = v.length; a < c; a++) n += "%" + ("00" + v.charCodeAt(a).toString(16)).slice(-2);
                    return decodeURIComponent(n)
                };
                u.qtqIFz = i, r = arguments, u.jPYOKz = !0
            }
            var a = v[0],
                c = e + a,
                f = r[c];
            return f ? n = f : (n = u.qtqIFz(n), r[c] = n), n
        })(r, e)
    }
    module.exports = i;
});
define("subPages/ticket/utils/utils.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: !0
    }), exports.keepTwoDecimalFull = exports.hasContent = exports.desensitization = exports.datefmt = exports.checkPhone = exports.checkIdcardValid = exports.checkIdcard = exports.checkGatjzz = exports.calcIDCard = exports.calcForTdCard = void 0;
    require("./ase");
    var t = require("./ValidForeignCard18"),
        e = (getApp(), exports.hasContent = function(t) {
            return !!t && "" != (t += "").replace(/\ +/g, "").replace(/[\r\n]/g, "")
        }, exports.checkPhone = function(t) {
            return /^[1][0-9]{10}$/.test(t)
        }, exports.checkIdcard = function(t) {
            "x" == t.slice(17, 18) && (t = t.replace("x", "X"));
            var e = "",
                r = !0;
            if ((t = t.toString()) && /^\d{6}(18|19|20)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(t))
                if ({
                        11: "北京",
                        12: "天津",
                        13: "河北",
                        14: "山西",
                        15: "内蒙古",
                        21: "辽宁",
                        22: "吉林",
                        23: "黑龙江 ",
                        31: "上海",
                        32: "江苏",
                        33: "浙江",
                        34: "安徽",
                        35: "福建",
                        36: "江西",
                        37: "山东",
                        41: "河南",
                        42: "湖北 ",
                        43: "湖南",
                        44: "广东",
                        45: "广西",
                        46: "海南",
                        50: "重庆",
                        51: "四川",
                        52: "贵州",
                        53: "云南",
                        54: "西藏 ",
                        61: "陕西",
                        62: "甘肃",
                        63: "青海",
                        64: "宁夏",
                        65: "新疆",
                        83: "台湾",
                        81: "香港",
                        82: "澳门",
                        91: "国外 "
                    }[t.substr(0, 2)]) {
                    if (18 == t.length) {
                        t = t.split("");
                        for (var s = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2], a = [1, 0, "X", 9, 8, 7, 6, 5, 4, 3, 2], n = 0, i = 0; i < 17; i++) n += t[i] * s[i];
                        a[n % 11] != t[17] && (e = "身份证号校验位错误", r = !1)
                    }
                } else e = "身份证号地址编码错误", r = !1;
            else e = "身份证号格式错误", r = !1;
            var o = {
                status: r,
                msg: e
            };
            return o
        }, exports.checkIdcardValid = function(r, s) {
            var a = {
                status: !0,
                errtips: ""
            };
            switch (r = parseInt(r)) {
                case 1:
                    /^\d{6}(18|19|20)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(s) || (a.status = !1, a.errtips = "身份证格式错误");
                    break;
                case 2:
                    /^[A-Z0-9]{5,17}$/.test(s) || (a.status = !1, a.errtips = "护照格式错误");
                    break;
                case 3:
                    /^[HM]{1}[0-9]{8}$/i.test(s) || (a.status = !1, a.errtips = "港澳居民来往内地通行证格式错误");
                    break;
                case 4:
                    /^[0-9]{8}$/i.test(s) || (a.status = !1, a.errtips = "台湾通行证格式错误");
                    break;
                case 5:
                    /^[0-9]{7}$/i.test(s) || (a.status = !1, a.errtips = "军官证格式错误");
                    break;
                case 6:
                    (0, t.isValidForeignCard18)(s).status || (0, t.isValidForeignCard15)(s).status || (a.status = !1, a.errtips = "外国人永久居留身份证格式错误");
                    break;
                case 7:
                    e(s) || (a.status = !1, a.errtips = "港澳台居民居住证错误");
                    break;
                case 13:
                    /^8[12]0000(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]$/.test(s) || (a.status = !1, a.errtips = "港澳居民居住证格式错误");
                    break;
                case 14:
                    /^830000(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]$/.test(s) || (a.status = !1, a.errtips = "台湾居民居住证格式错误");
                    break;
                case 88:
                    /^((HA|MA)[0-9]{7})$/.test(s) || (a.status = !1, a.errtips = "港澳居民来往内地通行证（非中国籍）错误")
            }
            return a
        }, exports.checkGatjzz = function(t) {
            var e = !0;
            if ((t = t.toString()) && /^8[123]0000(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]$/.test(t)) {
                t = t.split("");
                for (var r = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2], s = 0, a = 0; a < 17; a++) s += t[a] * r[a];
                [1, 0, "X", 9, 8, 7, 6, 5, 4, 3, 2][s % 11] != t[17] && (e = !1)
            } else e = !1;
            return e
        });
    exports.calcIDCard = function(t, e) {
        var r = t.toString(),
            s = parseInt(r.substring(6, 10)),
            a = parseInt(r.substring(10, 12)),
            n = parseInt(r.substring(12, 14)),
            i = new Date(e),
            o = parseInt(i.getFullYear()),
            u = parseInt(i.getMonth() + 1),
            p = parseInt(i.getDate()),
            c = o - s;
        return (u < a || u == a && p < n) && c--, c
    }, exports.calcForTdCard = function(e, r) {
        var s = new Date(r),
            a = parseInt(s.getFullYear()),
            n = parseInt(s.getMonth() + 1),
            i = parseInt(s.getDate());
        if (15 == e.length) {
            var o = (0, t.getForeignBirth15)(e).split("-"),
                u = o[0],
                p = o[1],
                c = o[2],
                g = a - u;
            return (n < p || n == p && i < c) && g--, console.log(g), g
        }
        u = e.substring(6, 10), p = e.substring(10, 12), c = e.substring(12, 14), g = a - u;
        return (n < p || n == p && i < c) && g--, g
    }, exports.desensitization = function(t) {
        if (t && t.length) {
            var e = t.length;
            if (1 === e) return "*";
            if (2 === e) return t[0] + "*";
            if (3 === e) return t[0] + "*" + t[2];
            if (e > 3 && e < 6) {
                for (var r = t.substring(1, e - 1), s = [], a = 0; a < r.length; a++) s.push("*");
                return t[0] + s.join("") + t[e - 1]
            }
            if (e >= 6 && e < 8) {
                for (var n = t.substring(2, e - 2), i = [], o = 0; o < n.length; o++) i.push("*");
                return t[0] + t[1] + i.join("") + t[e - 2] + t[e - 1]
            }
            for (var u = t.substring(3, e - 3), p = [], c = 0; c < u.length; c++) p.push("*");
            return t[0] + t[1] + t[2] + p.join("") + t[e - 3] + t[e - 2] + t[e - 1]
        }
    }, exports.keepTwoDecimalFull = function(t) {
        var e = parseFloat(t);
        if (isNaN(e)) return alert("传递参数错误，请检查！"), !1;
        var r = (e = Math.round(100 * t) / 100).toString(),
            s = r.indexOf(".");
        for (s < 0 && (s = r.length, r += "."); r.length <= s + 2;) r += "0";
        return r
    }, exports.datefmt = function() {
        var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : new Date,
            e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "YYYY-MM-DD hh:mm:ss",
            r = "string" == typeof t ? new Date(t) : t,
            s = ["日", "一", "二", "三", "四", "五", "六"],
            a = {
                "M+": r.getMonth() + 1,
                "D+": r.getDate(),
                "h+": r.getHours(),
                "m+": r.getMinutes(),
                "s+": r.getSeconds(),
                "q+": Math.floor((r.getMonth() + 3) / 3),
                "S+": r.getMilliseconds(),
                "w+": r.getDay()
            };
        for (var n in /(Y+)/i.test(e) && (e = e.replace(RegExp.$1, (r.getFullYear() + "").substr(4 - RegExp.$1.length))), a) a.hasOwnProperty(n) && ("w+" === n ? e = e.replace("w", "周" + s[a[n]]) : new RegExp("(" + n + ")").test(e) && (e = e.replace(RegExp.$1, 1 === RegExp.$1.length ? a[n] : ("00" + a[n]).substr(("" + a[n]).length))));
        return e
    };
});
__wxRoute = 'subPages/ticket/components/bottomBtn/index';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/components/bottomBtn/index.js';
define("subPages/ticket/components/bottomBtn/index.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    Component({
        properties: {},
        data: {},
        methods: {}
    });
});
require("subPages/ticket/components/bottomBtn/index.js");
__wxRoute = 'subPages/ticket/components/calendar/index';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/components/calendar/index.js';
define("subPages/ticket/components/calendar/index.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var t = require("../../../../@babel/runtime/helpers/interopRequireDefault").default;
    require("../../../../@babel/runtime/helpers/Arrayincludes");
    var a = t(require("@vant/weapp/toast/toast")),
        e = require("../../../../api/api_ticket"),
        l = require("../../../../api/globalData.js"),
        s = getApp();
    Component({
        properties: {
            calendarData: {
                type: Array,
                value: []
            },
            secretkey: {
                type: String,
                value: "1111"
            }
        },
        data: {
            chooseDate: "",
            hallId: "",
            scheduleId: "",
            hallList: [],
            scheduleList: [],
            base_url: l.ticketUrl,
            date: "",
            hallPoolRangeVOList: [],
            hallDataTips: ""
        },
        lifetimes: {
            attached: function() {
                console.log((new Date).getFullYear(), (new Date).getMonth());
                var t = (new Date).getMonth() + 1 > 9 ? (new Date).getMonth() + 1 : "0" + ((new Date).getMonth() + 1).toString();
                if (this.setData({
                        date: this.formatDate1((new Date).getFullYear(), t),
                        hallPoolRangeVOList: s.globalData.ticketAllSystemConfig.hallPoolRangeVOList
                    }), this.data.secretkey) {
                    console.log("现场扫码");
                    var a = {
                        currentTarget: {
                            dataset: {}
                        }
                    };
                    a.currentTarget.dataset.val = this.data.calendarData.find((function(t) {
                        return 1 == t.today
                    })), this.clickDate(a)
                }
            }
        },
        methods: {
            getHallData: function(t) {
                var a = this,
                    l = t.replaceAll("-", "/"),
                    i = {
                        hallType: 91,
                        openPerson: 1,
                        queryDate: l,
                        saleMode: 12
                    };
                (0, e.getHall)(i).then((function(t) {
                    if (console.log("getHall: ", t), a.setData({
                            hallList: t.data
                        }), 1 === t.data.length) {
                        var e = a.data.hallList[0].hallId,
                            i = a.data.hallPoolRangeVOList.filter((function(t) {
                                return t.hallId == e
                            }));
                        a.setData({
                            hallDataTips: i[0].orderIntroduction
                        }), a.sendData(!1), a.sendDialogtips(i[0].orderIntroduction), s.globalData.ticketTempData.hallData = i[0], e && a.chooseHallFormScan(e, l)
                    }
                })).catch((function(t) {
                    console.log(t)
                }))
            },
            chooseHallFormScan: function(t, a) {
                var l = this,
                    i = {
                        hallId: t,
                        hallType: 1,
                        openPerson: 1,
                        queryDate: a,
                        saleMode: 12
                    };
                (0, e.getScheduleByHallIdingore)(i).then((function(a) {
                    a.data && (l.setData({
                        hallId: t,
                        scheduleList: a.data,
                        scheduleId: ""
                    }), s.globalData.ticketTempData.hallId = t, s.globalData.ticketTempData.scheduleId = "")
                }))
            },
            sendData: function(t) {
                this.triggerEvent("changeTipsShow", t)
            },
            sendDialogtips: function(t) {
                this.triggerEvent("changeDialogTips", t)
            },
            clickDate: function(t) {
                var e = this,
                    l = t.currentTarget.dataset.val;
                if (console.log(l), !this.data.secretkey) {
                    if ([-1, 1].includes(l.status)) return void(0, a.default)("超出可预约日期范围，该日期不可选");
                    if (0 == l.status) return void(0, a.default)("当前日期为闭馆日，不可选");
                    if (2 == l.status) return void(0, a.default)("当前日期已停止预约");
                    if (3 == l.status) return void(0, a.default)("该日期已约满，请选择其他日期")
                }
                if (this.setData({
                        chooseDate: l.currentDate,
                        hallList: l.hallTicketPoolVOS,
                        hallDataTips: "",
                        date: this.formatDate1(l.currentDate.slice(0, 4), l.currentDate.slice(5, 7))
                    }), this.sendData(!0), s.globalData.ticketTempData.chooseDate = l.currentDate, s.globalData.ticketTempData.scheduleList = [], s.globalData.ticketTempData.scheduleId = "", s.globalData.ticketTempData.hallList = [], s.globalData.ticketTempData.hallId = "", this.data.secretkey) this.getHallData(l.currentDate);
                else if (1 == l.hallTicketPoolVOS.length && 4 == l.hallTicketPoolVOS[0].status) {
                    this.setData({
                        hallId: l.hallTicketPoolVOS[0].hallId,
                        scheduleList: l.hallTicketPoolVOS[0].scheduleTicketPoolVOS,
                        scheduleId: ""
                    });
                    var i = this.data.hallPoolRangeVOList.filter((function(t) {
                        return t.hallId == e.data.hallId
                    }));
                    this.setData({
                        hallDataTips: i[0].orderIntroduction
                    }), this.sendData(!1), this.sendDialogtips(i[0].orderIntroduction), s.globalData.ticketTempData.hallData = i[0], s.globalData.ticketTempData.hallId = l.hallTicketPoolVOS[0].hallId, s.globalData.ticketTempData.scheduleList = l.hallTicketPoolVOS[0].scheduleTicketPoolVOS
                } else this.setData({
                    scheduleList: [],
                    scheduleId: "",
                    hallId: ""
                })
            },
            clickHall: function(t) {
                var e = t.currentTarget.dataset.val;
                if (console.log(e), 0 != e.status)
                    if (1 != e.status)
                        if (2 != e.status)
                            if (3 != e.status)
                                if (-1 != e.status) {
                                    if (4 == e.status) {
                                        if (this.data.secretkey) {
                                            console.log(this.data.hallPoolRangeVOList, e);
                                            var l = this.data.hallPoolRangeVOList.filter((function(t) {
                                                return t.hallId == e.hallId
                                            }));
                                            return this.setData({
                                                hallDataTips: l[0].orderIntroduction
                                            }), this.sendData(!1), this.sendDialogtips(l[0].orderIntroduction), s.globalData.ticketTempData.hallId = e.hallId, s.globalData.ticketTempData.hallData = l[0], s.globalData.ticketTempData.scheduleList = e.scheduleTicketPoolVOS, s.globalData.ticketTempData.scheduleId = "", void this.chooseHallFormScan(e.hallId, this.data.chooseDate.replaceAll("-", "/"))
                                        }
                                        this.setData({
                                            hallId: e.hallId,
                                            scheduleList: e.scheduleTicketPoolVOS,
                                            scheduleId: ""
                                        });
                                        var i = this.data.hallPoolRangeVOList.filter((function(t) {
                                            return t.hallId == e.hallId
                                        }));
                                        this.setData({
                                            hallDataTips: i[0].orderIntroduction
                                        }), this.sendData(!1), this.sendDialogtips(i[0].orderIntroduction), s.globalData.ticketTempData.hallId = e.hallId, s.globalData.ticketTempData.hallData = i[0], s.globalData.ticketTempData.scheduleList = e.scheduleTicketPoolVOS, s.globalData.ticketTempData.scheduleId = ""
                                    }
                                } else(0, a.default)("不可选");
                else this.data.secretkey ? (0, a.default)("当前展览不可预约") : (0, a.default)("当前展览已约满，请选择其他日期或展览");
                else this.data.secretkey ? (0, a.default)("当前展览不可预约") : (0, a.default)("当前展览已约满，请选择其他日期或展览");
                else(0, a.default)("当前展览已停止预约");
                else(0, a.default)("当前展览已停止预约")
            },
            clickSchedule: function(t) {
                var e = t.currentTarget.dataset.val;
                console.log(e), 2 != e.status ? 3 != e.status ? 1 != e.status ? 4 == e.status && (this.setData({
                    scheduleId: e.hallScheduleId
                }), s.globalData.ticketTempData.scheduleId = e.hallScheduleId, s.globalData.ticketTempData.schedule = e) : (0, a.default)("不可预约") : (0, a.default)("当前场次已约满") : (0, a.default)("当前场次已停止预约")
            },
            formatDate1: function(t, a) {
                return t + "." + a
            }
        }
    });
});
require("subPages/ticket/components/calendar/index.js");
__wxRoute = 'subPages/ticket/components/custom/custom';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/components/custom/custom.js';
define("subPages/ticket/components/custom/custom.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var a = getApp();
    Component({
        options: {
            styleIsolation: "apply-shared"
        },
        properties: {
            navName: String,
            theme: {
                type: String,
                value: "black"
            },
            seize: {
                type: Boolean,
                value: !0
            },
            showCpsule: {
                type: Boolean,
                value: !0
            },
            navigationBarBackgroundColor: {
                type: String,
                value: ""
            },
            navigationBarTitleText: {
                type: String,
                value: "#2c2b2b"
            },
            navBarButtonBackgroundColor: {
                type: String,
                value: "rgba(0, 0, 0, .05)"
            }
        },
        data: {
            height: "",
            back: a.globalData.base_img_url + "back.png",
            home: a.globalData.base_img_url + "home.png"
        },
        lifetimes: {
            attached: function() {
                this.setData({
                    height: a.globalData.height,
                    infos: a.globalData.infosButton
                }), this.properties.navName ? this.setData({
                    navName: this.properties.navName
                }) : this.setData({
                    navName: a.globalData.name
                })
            }
        },
        pageLifetimes: {
            show: function() {
                a.globalData.navFirsts || setTimeout((function() {
                    var t = wx.getMenuButtonBoundingClientRect();
                    t && (a.globalData.navFirsts = !0, a.globalData.infosButton = t)
                }), 500)
            }
        },
        methods: {
            navback: function() {
                getCurrentPages().length, this.backhome()
            },
            backhome: function() {
                wx.reLaunch({
                    url: "/pages/index/index"
                })
            }
        }
    });
});
require("subPages/ticket/components/custom/custom.js");
__wxRoute = 'subPages/ticket/components/dialog/index';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/components/dialog/index.js';
define("subPages/ticket/components/dialog/index.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var t = require("../../../../api/globalData.js");
    Component({
        properties: {
            title: {
                type: String,
                value: "标题"
            },
            content: {
                type: String,
                value: "正文"
            },
            type: {
                type: String,
                value: "default"
            },
            btnText: {
                type: String,
                value: "确定"
            },
            btnAgree: {
                type: String,
                value: "同意"
            }
        },
        data: {
            btnType: "disable",
            base_url: t.ticketUrl
        },
        methods: {
            scrollToBottom: function() {
                console.log("到底了"), this.setData({
                    btnType: "default"
                })
            },
            click: function() {
                this.triggerEvent("click")
            }
        }
    });
});
require("subPages/ticket/components/dialog/index.js");
__wxRoute = 'subPages/ticket/components/pay/pay';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/components/pay/pay.js';
define("subPages/ticket/components/pay/pay.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var e = (0, require("../../../../@babel/runtime/helpers/interopRequireDefault").default)(require("@vant/weapp/toast/toast")),
        t = require("../../../../api/api_index"),
        a = require("../../../../api/api_ticket"),
        o = require("../../../../api/globalData.js"),
        n = getApp();
    Component({
        properties: {
            orderData: {
                type: Object,
                value: {}
            }
        },
        data: {
            base_url: o.ticketUrl,
            openid: "",
            time: ""
        },
        lifetimes: {
            attached: function() {
                var e = this;
                (0, a.get_sys_time)().then((function(t) {
                    var a = t.msg.replace(/-/g, "/"),
                        o = 60 * n.globalData.ticketAllSystemConfig.systemConfigurationVo.personPayHoldPeriod * 1e3 - (new Date(a).getTime() - new Date(e.data.orderData.createTime.replace(/-/g, "/")).getTime());
                    e.setData({
                        time: o
                    }), e.selectComponent(".control-count-down").start()
                }))
            }
        },
        methods: {
            finished: function() {
                this.onClose(1)
            },
            closeAction: function() {
                this.onClose(0)
            },
            pay: function() {
                var e = this,
                    a = this;
                wx.showLoading({
                    title: "支付加载中"
                });
                var o = wx.getStorageSync("sessions");
                o.openid && a.setData({
                    openid: o.openid
                });
                var n = {
                    id: this.data.orderData.orderId,
                    payType: 22,
                    payChannel: 5,
                    miniOpenId: this.data.openid
                };
                (0, t.orderInfoPayQuery)(n).then((function(t) {
                    console.log("orderInfoPayQuery: ", t), e.startPay(t.data)
                })).catch((function(e) {
                    a.onClose(0)
                }))
            },
            onClose: function() {
                var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                    t = {
                        payState: e
                    };
                this.triggerEvent("onClose", t)
            },
            startPay: function(t) {
                var a = this,
                    o = JSON.parse(t);
                console.log("===", o), wx.hideLoading(), wx.requestPayment({
                    timeStamp: o.timestamp,
                    nonceStr: o.noncestr,
                    package: o.package,
                    signType: o.signType,
                    paySign: o.sign,
                    success: function(e) {
                        console.log("支付成功====", e), a.onClose(2)
                    },
                    fail: function(t) {
                        console.log(t), e.default.loading({
                            message: "支付遇到问题",
                            forbidClick: !0,
                            duration: 1e3
                        }), a.onClose(0)
                    }
                })
            }
        }
    });
});
require("subPages/ticket/components/pay/pay.js");
__wxRoute = 'subPages/ticket/components/personInfo/personInfo';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/components/personInfo/personInfo.js';
define("subPages/ticket/components/personInfo/personInfo.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var t = (0, require("../../../../@babel/runtime/helpers/interopRequireDefault").default)(require("@vant/weapp/toast/toast")),
        e = require("../../../../api/globalData.js"),
        a = require("../../utils/utils.js"),
        i = getApp();
    Component({
        properties: {
            tableData: {
                type: Array,
                value: []
            },
            contactList: {
                type: Array,
                value: []
            },
            cardTypeList: {
                type: Array,
                value: []
            },
            maxPerson: {
                type: Number,
                value: 0
            }
        },
        data: {
            base_url: e.ticketUrl,
            followerSettingsTip: "务必准确填写身份信息",
            showMoreContact: !1,
            dialogShow: !1,
            ticketTip: "",
            showOcr: !1
        },
        lifetimes: {
            attached: function() {
                var t = i.globalData.ticketAllSystemConfig,
                    e = t.followerSettingVoList,
                    a = "1" == t.systemConfigurationVo.ocrEnable;
                this.setData({
                    showOcr: a
                });
                var r = i.globalData.ticketTempData.hallId,
                    n = e.filter((function(t) {
                        return t.hallId.toString() === r.toString()
                    }))[0];
                1 == n.followerEnable && this.setData({
                    followerSettingsTip: n.tips
                })
            }
        },
        methods: {
            showMore: function() {
                this.setData({
                    showMoreContact: !0
                })
            },
            clickContact: function(e) {
                var a = e.currentTarget.dataset,
                    i = a.val,
                    r = a.index;
                this.data.cardTypeList.findIndex((function(t) {
                    return t.value == i.certificateType
                })) < 0 ? (0, t.default)("观众证件类型不符合该展览的证件类型要求") : this.triggerEvent("clickContact", {
                    val: i,
                    index: r
                })
            },
            pickCardType: function(t) {
                var e = t.detail.value,
                    a = t.target.dataset.index;
                this.triggerEvent("pickCardType", {
                    tableDataIndex: a,
                    cardTypeIndex: e
                })
            },
            inputName: function(t) {
                console.log(t);
                var e = t.detail.value,
                    a = t.target.dataset.index;
                this.triggerEvent("inputName", {
                    tableDataIndex: a,
                    val: e
                })
            },
            inputCardId: function(t) {
                console.log(t);
                var e = t.detail.value,
                    a = t.target.dataset.index;
                this.triggerEvent("inputCardId", {
                    tableDataIndex: a,
                    val: e
                })
            },
            ticketChange: function(t) {
                var e = t.detail,
                    a = t.target.dataset.index;
                this.triggerEvent("ticketChange", {
                    tableDataIndex: a,
                    priceId: e
                })
            },
            clickTicket: function(e) {
                console.log(e);
                var r = e.currentTarget.dataset,
                    n = r.ticket,
                    o = r.person;
                if (3 != n.status) {
                    if (1 == o.card_type || 7 == o.card_type) {
                        var l = (0, a.calcIDCard)(o.card_id, i.globalData.ticketTempData.chooseDate);
                        if (l < n.ageMin || l > n.ageMax) return (0, t.default)("年龄不符"), !1
                    }
                    n.certificateVOS.findIndex((function(t) {
                        return t.id == o.card_type
                    })) < 0 && (0, t.default)("该证件类型不能购买这种门票")
                } else(0, t.default)("预约已满，无可预约名额")
            },
            addPerson: function() {
                this.triggerEvent("addPerson")
            },
            delPerson: function(t) {
                var e = t.currentTarget.dataset.index;
                this.triggerEvent("delPerson", e)
            },
            ocrInput: function(t) {
                console.log(t);
                var e = t.detail.file,
                    a = t.currentTarget.dataset.index;
                this.triggerEvent("ocrInput", {
                    file: e,
                    index: a
                })
            },
            showTicketTip: function(t) {
                console.log(t);
                var e = t.currentTarget.dataset.ticket;
                this.setData({
                    dialogShow: !0,
                    ticketTip: e.document
                })
            },
            dialogConfirm: function() {
                this.setData({
                    dialogShow: !1
                })
            }
        }
    });
});
require("subPages/ticket/components/personInfo/personInfo.js");
__wxRoute = 'subPages/ticket/components/timeDialog/index';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/components/timeDialog/index.js';
define("subPages/ticket/components/timeDialog/index.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var t = require("../../../../api/globalData.js");
    Component({
        properties: {
            title: {
                type: String,
                value: "标题"
            },
            content: {
                type: String,
                value: "正文"
            },
            type: {
                type: String,
                value: "default"
            },
            btnText: {
                type: String,
                value: "确定"
            },
            btnAgree: {
                type: String,
                value: "同意"
            },
            second: {
                type: String,
                value: "3"
            }
        },
        data: {
            btnType: "disable",
            base_url: t.ticketUrl,
            timer: null
        },
        methods: {
            click: function() {
                this.triggerEvent("click")
            }
        },
        lifetimes: {
            attached: function() {
                var t = this,
                    e = this.data.second;
                this.data.timer = setInterval((function() {
                    0 == e ? t.setData({
                        btnType: "default"
                    }) : t.setData({
                        second: e--
                    })
                }), 1e3)
            },
            detached: function() {
                this.setData({
                    timer: null
                })
            }
        }
    });
});
require("subPages/ticket/components/timeDialog/index.js");
__wxRoute = 'subPages/ticket/personal/home/index';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/personal/home/index.js';
define("subPages/ticket/personal/home/index.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var e = require("../../../../@babel/runtime/helpers/interopRequireDefault").default,
        t = require("../../../../@babel/runtime/helpers/regeneratorRuntime"),
        a = require("../../../../@babel/runtime/helpers/asyncToGenerator"),
        n = require("@/api/api_ticket"),
        i = require("@/api/api_login.js"),
        o = require("@/api/api_ticket.js"),
        r = require("@/api/api_index.js"),
        s = require("@/api/api_user.js"),
        c = require("@/api/globalData.js"),
        l = require("../../utils/utils"),
        u = (e(require("@vant/weapp/toast/toast")), require("@/utils/turingSDK")),
        g = getApp();
    Page({
        data: {
            loading: !0,
            base_url: c.ticketUrl,
            realNamePageVO: "",
            dialogShow: !1,
            secretkey: "",
            timer: null,
            isShowAllTips: !0,
            isLogin: !1,
            isShowBtn: !1,
            realNameInfo: "",
            certificateInfo: "",
            currentDay: "",
            calendarList: [],
            showNeedRealDialog: !1,
            realNamePlaceOrder: 0,
            unBindbutton: 0,
            showCancelBindDialog: !1,
            isOpenRequest: !0,
            isInitSuccess: !1
        },
        onLoad: function(e) {
            console.log(e), e.secretkey ? (this.setData({
                secretkey: e.secretkey
            }), g.globalData.secretkey = e.secretkey, this.getScanText()) : g.globalData.secretkey = null, console.log(g.globalData), this.getSetting(), wx.hideToast(), this.setData({
                showNeedRealDialog: !1,
                isShowAllTips: !0
            })
        },
        onShow: function() {
            var e = this;
            wx.getStorageSync("isShowHomeDialog"), wx.getStorageSync("jtoken") ? (this.getSession(), setTimeout((function() {
                wx.getStorageSync("realNameInfo") ? (e.setData({
                    realNameInfo: wx.getStorageSync("realNameInfo") || ""
                }), wx.getStorageSync("realNameInfo").certificateInfo && e.setData({
                    certificateInfo: (0, l.desensitization)(wx.getStorageSync("realNameInfo").certificateInfo)
                })) : (0, s.get_users_isReal)().then((function(t) {
                    wx.setStorage({
                        key: "realNameInfo",
                        data: t.data
                    }), e.setData({
                        realNameInfo: t.data,
                        certificateInfo: (0, l.desensitization)(t.data.certificateInfo)
                    })
                })), e.setData({
                    isShowBtn: !0
                })
            }), 100), this.setData({
                isLogin: !0
            })) : this.setData({
                isShowBtn: !0
            })
        },
        getSession: function() {
            var e = this;
            return a(t().mark((function a() {
                var n, o;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            if (!e.data.isOpenRequest) {
                                t.next = 14;
                                break
                            }
                            if (wx.getStorageSync("sessions")) {
                                t.next = 13;
                                break
                            }
                            return t.next = 4, (0, c.getCode)();
                        case 4:
                            return n = t.sent, console.log(n), t.next = 8, (0, i.get_wx_mini_session1)(n);
                        case 8:
                            200 == (o = t.sent).code && wx.setStorage({
                                key: "sessions",
                                data: o.data
                            }), e.initTuringCore(), t.next = 14;
                            break;
                        case 13:
                            e.initTuringCore();
                        case 14:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        initTuringCore: function() {
            var e = this,
                t = wx.getStorageSync("sessions");
            u.init({
                channel: "109045",
                page: e,
                openid: t.openid,
                implement: {
                    getTouch: function(e) {
                        console.log(e)
                    }
                }
            }, (function(t) {
                console.log(t, "-----------------------------"), 0 == t.ret && (e.setData({
                    isInitSuccess: !0
                }), console.log("初始化成功11111111111111111111111111111111"))
            }))
        },
        getDeviceTokenFun: function() {
            return new Promise((function(e, t) {
                setTimeout((function() {
                    e("")
                }), 3e3), u.getDeviceToken((function(t) {
                    console.log(t, "结果结果结果"), 0 == t.ret ? (console.log(2222222222), e(t.deviceToken)) : (console.log(3333333333), e(""))
                }))
            }))
        },
        cancelBindReal: function() {
            this.setData({
                showCancelBindDialog: !0
            })
        },
        dialogCancelBind: function() {
            this.setData({
                showCancelBindDialog: !1
            })
        },
        dialogConfirmBind: function() {
            var e = this,
                t = this;
            this.setData({
                showCancelBindDialog: !1
            }), (0, r.unbindBySelf)().then((function(e) {
                wx.removeStorage("realNameInfo"), wx.showToast({
                    title: e.msg,
                    icon: "none",
                    duration: 3e3
                }), (0, s.get_users_isReal)().then((function(e) {
                    wx.setStorage({
                        key: "realNameInfo",
                        data: e.data
                    }), t.setData({
                        realNameInfo: e.data,
                        showCancelBindDialog: !1
                    })
                }))
            })).catch((function(t) {
                e.setData({
                    showCancelBindDialog: !1
                })
            }))
        },
        next: function() {
            wx.setStorage({
                key: "isShowHomeDialog",
                data: !0
            }), this.setData({
                dialogShow: !1
            })
        },
        onReady: function() {},
        goRealFun: function() {
            var e = this.data,
                t = e.realNameInfo;
            e.isLogin ? t.bindRealName ? this.setData({
                showCancelBindDialog: !0
            }) : wx.navigateTo({
                url: "/subPages/ticket/personal/realName/index?redirect=".concat(encodeURIComponent("/subPages/ticket/personal/home/index"))
            }) : wx.navigateTo({
                url: "/pages/login/index"
            })
        },
        getScanText: function() {
            var e = this;
            return a(t().mark((function a() {
                var i, o;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            return t.next = 2, (0, n.get_text)("scancode_subscribe_tips");
                        case 2:
                            return i = t.sent, t.next = 5, (0, n.get_text)("scancode_notice_for_booking");
                        case 5:
                            o = t.sent, e.setData({
                                scancode_subscribe_tips: [{
                                    parameterIntroduction: "预约须知",
                                    parameterDescription: i.data.parameterDescription
                                }],
                                scancode_notice_for_booking: o.data.parameterDescription
                            });
                        case 7:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        getSetting: function() {
            var e = "realMess",
                t = this;
            if (wx.getStorageSync(e)) {
                var a = wx.getStorageSync(e);
                if (Date.parse(new Date) > a.expire_time)(0, n.get_ticket_real_system_config)().then((function(a) {
                    g.globalData.ticketAllSystemConfig = a.data, wx.setStorageSync(e, {
                        value: a.data,
                        expire_time: Date.parse(new Date) + 6e5
                    }), t.setData({
                        loading: !1,
                        realNamePageVO: a.data,
                        realNamePlaceOrder: a.data.p,
                        unBindbutton: a.data.u
                    })
                }));
                else g.globalData.ticketAllSystemConfig = a.value, t.setData({
                    loading: !1,
                    realNamePageVO: a.value,
                    realNamePlaceOrder: a.value.p,
                    unBindbutton: a.value.u
                })
            } else {
                (0, n.get_ticket_real_system_config)().then((function(a) {
                    g.globalData.ticketAllSystemConfig = a.data, wx.setStorageSync(e, {
                        value: a.data,
                        expire_time: Date.parse(new Date) + 6e5
                    }), t.setData({
                        loading: !1,
                        realNamePageVO: a.data,
                        realNamePlaceOrder: a.data.p,
                        unBindbutton: a.data.u
                    })
                }))
            }
        },
        check: function() {
            var e = this;
            return a(t().mark((function a() {
                var n, i, r, s, c, l, u, g;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            if ("1" != wx.getStorageSync("isCanClicks")) {
                                t.next = 3;
                                break
                            }
                            return t.abrupt("return", !1);
                        case 3:
                            if (wx.setStorage({
                                    key: "isCanClicks",
                                    data: "1"
                                }), setTimeout((function() {
                                    wx.setStorage({
                                        key: "isCanClicks",
                                        data: "2"
                                    })
                                }), 1200), "" != wx.getStorageSync("jtoken")) {
                                t.next = 9;
                                break
                            }
                            return wx.clearStorage(), wx.navigateTo({
                                url: "/pages/login/index"
                            }), t.abrupt("return");
                        case 9:
                            if (1 != e.data.realNamePlaceOrder) {
                                t.next = 41;
                                break
                            }
                            if (!e.data.realNameInfo.bindRealName) {
                                t.next = 38;
                                break
                            }
                            if (!e.data.isOpenRequest) {
                                t.next = 34;
                                break
                            }
                            if (!e.data.isInitSuccess) {
                                t.next = 32;
                                break
                            }
                            return t.next = 15, e.getDeviceTokenFun();
                        case 15:
                            if (n = t.sent, console.log(n, "获取设备指纹获取设备指纹获取设备指纹获取设备指纹"), n) {
                                t.next = 20;
                                break
                            }
                            return wx.showToast({
                                title: "数据加载异常，请重新进入小程序",
                                icon: "none"
                            }), t.abrupt("return", !1);
                        case 20:
                            return i = wx.getStorageSync("sessions"), r = {
                                code: n,
                                unionId: i.unionid,
                                miniOpenId: i.openid
                            }, t.next = 24, (0, o.go_ticket_needLogin)(r);
                        case 24:
                            if (1 != (s = t.sent).data.strategy) {
                                t.next = 28;
                                break
                            }
                            return wx.navigateTo({
                                url: "/subPages/ticket/personal/index/index"
                            }), t.abrupt("return", !1);
                        case 28:
                            if (0 != s.data.strategy) {
                                t.next = 31;
                                break
                            }
                            return wx.showToast({
                                title: s.data.prompt,
                                icon: "none"
                            }), t.abrupt("return");
                        case 31:
                            3 == s.data.strategy && wx.navigateTo({
                                url: "/pages/face/index?identityId=" + s.data.uuId + "&isHome=1"
                            });
                        case 32:
                            t.next = 36;
                            break;
                        case 34:
                            return wx.navigateTo({
                                url: "/subPages/ticket/personal/index/index"
                            }), t.abrupt("return", !1);
                        case 36:
                            t.next = 39;
                            break;
                        case 38:
                            e.setData({
                                showNeedRealDialog: !0
                            });
                        case 39:
                            t.next = 66;
                            break;
                        case 41:
                            if (!e.data.isOpenRequest) {
                                t.next = 64;
                                break
                            }
                            if (!e.data.isInitSuccess) {
                                t.next = 62;
                                break
                            }
                            return t.next = 45, e.getDeviceTokenFun();
                        case 45:
                            if (c = t.sent, console.log(c, "获取设备指纹获取设备指纹获取设备指纹获取设备指纹"), c) {
                                t.next = 50;
                                break
                            }
                            return wx.showToast({
                                title: "数据加载异常，请重新进入小程序",
                                icon: "none"
                            }), t.abrupt("return", !1);
                        case 50:
                            return l = wx.getStorageSync("sessions"), u = {
                                code: c,
                                unionId: l.unionid,
                                miniOpenId: l.openid
                            }, t.next = 54, (0, o.go_ticket_needLogin)(u);
                        case 54:
                            if (1 != (g = t.sent).data.strategy) {
                                t.next = 58;
                                break
                            }
                            return wx.navigateTo({
                                url: "/subPages/ticket/personal/index/index"
                            }), t.abrupt("return", !1);
                        case 58:
                            if (0 != g.data.strategy) {
                                t.next = 61;
                                break
                            }
                            return wx.showToast({
                                title: g.data.prompt,
                                icon: "none"
                            }), t.abrupt("return");
                        case 61:
                            3 == g.data.strategy && wx.navigateTo({
                                url: "/pages/face/index?identityId=" + g.data.uuId + "&isHome=1"
                            });
                        case 62:
                            t.next = 66;
                            break;
                        case 64:
                            return wx.navigateTo({
                                url: "/subPages/ticket/personal/index/index"
                            }), t.abrupt("return", !1);
                        case 66:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        dialogConfirm: function() {
            wx.navigateTo({
                url: "/subPages/ticket/personal/realName/index?redirect=".concat(encodeURIComponent("/subPages/ticket/personal/home/index"))
            })
        },
        userCenter: function() {
            getApp().globalData.isConnected ? wx.navigateTo({
                url: "/pages/user/index"
            }) : wx.showToast({
                title: "当前网络不可用，请检查网络设置",
                icon: "none",
                duration: 3e3
            })
        },
        onHide: function() {
            getApp().globalData.requestTasks.gainAllSystemConfigLogin && (getApp().globalData.requestTasks.gainAllSystemConfigLogin.abort(), console.log(" ===  abort() === gainAllSystemConfigLogin"))
        },
        onUnload: function() {
            getApp().globalData.requestTasks.gainAllSystemConfigLogin && (getApp().globalData.requestTasks.gainAllSystemConfigLogin.abort(), console.log(" ===  abort() === gainAllSystemConfigLogin"))
        },
        onPullDownRefresh: function() {},
        onReachBottom: function() {},
        onShareAppMessage: function() {},
        formatDate1: function(e, t) {
            var a = t;
            return a < 10 && (a = "0" + a), e + "." + a
        }
    });
});
require("subPages/ticket/personal/home/index.js");
__wxRoute = 'subPages/ticket/personal/index/index';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/personal/index/index.js';
define("subPages/ticket/personal/index/index.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var e = require("../../../../@babel/runtime/helpers/interopRequireDefault").default,
        t = require("../../../../@babel/runtime/helpers/regeneratorRuntime"),
        a = require("../../../../@babel/runtime/helpers/asyncToGenerator"),
        n = require("../../../../api/api_ticket"),
        o = require("@/api/api_user.js"),
        i = require("@/api/api_login.js"),
        r = require("../../../../api/globalData.js"),
        s = e(require("@vant/weapp/toast/toast")),
        l = getApp(),
        c = require("@/utils/turingSDK");
    Page({
        data: {
            loading: !0,
            base_url: r.ticketUrl,
            calendarShow: !1,
            calendarData: [],
            noticeList: [],
            announcementList: [],
            dialogShow: !1,
            noticeText: "",
            orderDialogShow: !1,
            secretkey: "",
            hall: {
                status: !0,
                msg: ""
            },
            timer: null,
            hasData: !1,
            orderLoad: !1,
            isShowAllTips: !0,
            realNamePlaceOrder: 0,
            isOpenRequest: !1,
            isInitSuccess: !1,
            isRequest: !1,
            isShowCalandar: !0,
            scancode_notice_for_booking: []
        },
        onLoad: function(e) {
            (e.secretkey ? (this.setData({
                secretkey: e.secretkey
            }), l.globalData.secretkey = e.secretkey, this.getScanText()) : l.globalData.secretkey = null, e.q) && (-1 != decodeURIComponent(e.q).indexOf("scanKey") && (this.setData({
                secretkey: "knshdgdkshalal"
            }), l.globalData.secretkey = "knshdgdkshalal", console.log("进入扫码通道"), this.getScanText()));
            e.isSao && (this.setData({
                secretkey: "knshdgdkshalal"
            }), l.globalData.secretkey = "knshdgdkshalal", this.getScanText()), console.log("app.globalData.secretkey"), console.log(l.globalData)
        },
        onReady: function() {},
        onShow: function() {
            wx.hideToast(), this.data.isOpenRequest && this.getSession(), this.setData({
                dialogShow: !1,
                orderDialogShow: !1,
                loading: !0,
                isShowAllTips: !0,
                orderLoad: !1
            }), this.getSetting()
        },
        getSession: function() {
            var e = this;
            return a(t().mark((function a() {
                var n, o;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            if (!e.data.isOpenRequest) {
                                t.next = 14;
                                break
                            }
                            if (wx.getStorageSync("sessions")) {
                                t.next = 13;
                                break
                            }
                            return t.next = 4, (0, r.getCode)();
                        case 4:
                            return n = t.sent, console.log(n), t.next = 8, (0, i.get_wx_mini_session1)(n);
                        case 8:
                            200 == (o = t.sent).code && wx.setStorage({
                                key: "sessions",
                                data: o.data
                            }), e.initTuringCore(), t.next = 14;
                            break;
                        case 13:
                            e.initTuringCore();
                        case 14:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        initTuringCore: function() {
            var e = this,
                t = wx.getStorageSync("sessions");
            c.init({
                channel: "109045",
                page: e,
                openid: t.openid,
                implement: {
                    getTouch: function(e) {
                        console.log(e)
                    }
                }
            }, (function(t) {
                0 == t.ret && e.setData({
                    isInitSuccess: !0
                })
            }))
        },
        getDeviceTokenFun: function() {
            return new Promise((function(e, t) {
                setTimeout((function() {
                    e("")
                }), 3e3), c.getDeviceToken((function(t) {
                    console.log(t, "结果结果结果"), 0 == t.ret ? (console.log(2222222222), e(t.deviceToken)) : (console.log(3333333333), e(""))
                }))
            }))
        },
        changeTipsShow: function(e) {
            this.setData({
                isShowAllTips: e.detail
            })
        },
        changeDialogTips: function(e) {
            this.setData({
                noticeText: e.detail
            })
        },
        getScanText: function() {
            var e = this;
            return a(t().mark((function a() {
                var o;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            return t.next = 2, (0, n.get_text)("scancode_notice_for_booking");
                        case 2:
                            o = t.sent, e.setData({
                                scancode_notice_for_booking: [{
                                    parameterIntroduction: "预约须知",
                                    parameterDescription: o.data.parameterDescription
                                }]
                            }), console.log(e.data.scancode_notice_for_booking, "scancode_notice_for_bookingscancode_notice_for_booking");
                        case 5:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        getSetting: function() {
            var e = this,
                t = this,
                a = this.data.hall;
            this.setData({
                calendarShow: !1,
                calendarData: []
            }), t.data.hasData = !1, l.globalData.ticketAllSystemConfig = null, console.log(wx.getStorageSync("jtoken"));
            var i = (0, n.get_ticket_all_system_config)();
            console.log(i), i.then((function(n) {
                var i = new Array("周一", "周二", "周三", "周四", "周五", "周六", "周日");
                if (n.data.calendarTicketPoolsByDate.forEach((function(e, t) {
                        e.week = i[t % 7], e.day = e.currentDate.slice(8, 10)
                    })), t.data.hasData = !0, l.globalData.ticketAllSystemConfig = n.data, l.globalData.ticketTempData = {}, a.status = "1" == n.data.systemConfigurationVo.hallStatus, a.msg = n.data.systemConfigurationVo.museumStopSaleContent, t.setData({
                        noticeList: l.globalData.ticketAllSystemConfig.homeCopyWriterVoList,
                        announcementList: l.globalData.ticketAllSystemConfig.announcementInfoVOList,
                        calendarData: l.globalData.ticketAllSystemConfig.calendarTicketPoolsByDate,
                        calendarShow: !0,
                        hall: a,
                        loading: !1,
                        realNamePlaceOrder: l.globalData.ticketAllSystemConfig.systemConfigurationVo.realNamePlaceOrder
                    }), console.log("判断是否实名"), !(1 != e.data.realNamePlaceOrder || wx.getStorageSync("realNameInfo") && wx.getStorageSync("realNameInfo").bindRealName)) return (0, s.default)("请先实名"), void setTimeout((function() {
                    wx.navigateTo({
                        url: "/subPages/ticket/personal/home/index"
                    })
                }), 1e3);
                e.data.secretkey && (console.log("是扫码进入，在判断登录后，开始判断是否实名"), (0, o.get_users_isReal)().then((function(e) {
                    e.data.bindRealName ? wx.setStorage({
                        key: "realNameInfo",
                        data: e.data
                    }) : wx.navigateTo({
                        url: "/subPages/ticket/personal/realName/index?isSao=1"
                    })
                })))
            }))
        },
        check: function() {
            if ("" != wx.getStorageSync("jtoken")) return !!l.globalData.ticketAllSystemConfig && (this.data.hall.status ? void this.openDialog() : ((0, s.default)("暂未开放"), !1));
            wx.navigateTo({
                url: "/pages/login/index"
            })
        },
        openDialog: function() {
            var e = arguments,
                o = this;
            return a(t().mark((function a() {
                var i, r;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            if (i = e.length > 0 && void 0 !== e[0] ? e[0] : null, r = o, o.data.orderDialogShow && o.setData({
                                    orderDialogShow: !1
                                }), l.globalData.ticketTempData.chooseDate) {
                                t.next = 6;
                                break
                            }
                            return (0, s.default)("请选择入馆日期"), t.abrupt("return");
                        case 6:
                            if (l.globalData.ticketTempData.hallId) {
                                t.next = 9;
                                break
                            }
                            return (0, s.default)("请选择展览"), t.abrupt("return");
                        case 9:
                            if (l.globalData.ticketTempData.scheduleId) {
                                t.next = 12;
                                break
                            }
                            return o.data.secretkey ? (0, s.default)("请选择参观时段") : (0, s.default)("请选择入馆时段"), t.abrupt("return");
                        case 12:
                            if ((!i || i.currentTarget.dataset.confirm) && i) {
                                t.next = 25;
                                break
                            }
                            if ("false" != l.globalData.ticketAllSystemConfig.systemConfigurationVo.allFree) {
                                t.next = 25;
                                break
                            }
                            if (!o.data.orderLoad) {
                                t.next = 16;
                                break
                            }
                            return t.abrupt("return");
                        case 16:
                            return o.data.orderLoad = !0, t.next = 19, (0, n.get_ticket_order_list)({
                                status: 1
                            });
                        case 19:
                            if (!(t.sent.total > 0)) {
                                t.next = 24;
                                break
                            }
                            return r.setData({
                                orderDialogShow: !0
                            }), r.data.orderLoad = !1, t.abrupt("return");
                        case 24:
                            r.data.orderLoad = !1;
                        case 25:
                            o.data.secretkey, o.setData({
                                dialogShow: !0
                            });
                        case 26:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        orderDialogConfirm: function() {
            this.setData({
                orderDialogShow: !1
            }), this.userCenter()
        },
        userCenter: function() {
            getApp().globalData.isConnected ? wx.navigateTo({
                url: "/subPages/order/order"
            }) : wx.showToast({
                title: "当前网络不可用，请检查网络设置",
                icon: "none",
                duration: 3e3
            })
        },
        next: function() {
            var e = this;
            return a(t().mark((function a() {
                var o, i, r, s;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            if (!e.data.isOpenRequest) {
                                t.next = 28;
                                break
                            }
                            if (!e.data.isInitSuccess) {
                                t.next = 26;
                                break
                            }
                            if (!e.data.isRequest) {
                                t.next = 4;
                                break
                            }
                            return t.abrupt("return");
                        case 4:
                            return e.setData({
                                isRequest: !0
                            }), t.next = 7, e.getDeviceTokenFun();
                        case 7:
                            if (o = t.sent, console.log(o, "获取设备指纹获取设备指纹获取设备指纹获取设备指纹"), o) {
                                t.next = 12;
                                break
                            }
                            return wx.showToast({
                                title: "数据加载异常，请重新进入小程序",
                                icon: "none"
                            }), t.abrupt("return", !1);
                        case 12:
                            return i = wx.getStorageSync("sessions"), r = {
                                code: o,
                                unionId: i.unionid,
                                miniOpenId: i.openid
                            }, t.next = 16, (0, n.go_ticket_needLogin)(r);
                        case 16:
                            if (s = t.sent, e.setData({
                                    isRequest: !1
                                }), 1 != s.data.strategy) {
                                t.next = 22;
                                break
                            }
                            return wx.navigateTo({
                                url: "/subPages/ticket/personal/fillInfo/fillInfo"
                            }), e.setData({
                                dialogShow: !1
                            }), t.abrupt("return", !1);
                        case 22:
                            if (0 != s.data.strategy) {
                                t.next = 25;
                                break
                            }
                            return wx.showToast({
                                title: s.data.prompt,
                                icon: "none"
                            }), t.abrupt("return");
                        case 25:
                            3 == s.data.strategy && wx.navigateTo({
                                url: "/pages/face/index?identityId=" + s.data.uuId + "&isHome=1"
                            });
                        case 26:
                            t.next = 31;
                            break;
                        case 28:
                            return wx.navigateTo({
                                url: "/subPages/ticket/personal/fillInfo/fillInfo"
                            }), e.setData({
                                dialogShow: !1
                            }), t.abrupt("return", !1);
                        case 31:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        noticeDetail: function(e) {
            var t = e.currentTarget.dataset.id;
            wx.navigateTo({
                url: "/subPages/ticket/notice/detail?id=" + t
            })
        },
        moreNotice: function() {
            wx.navigateTo({
                url: "/subPages/ticket/notice/list"
            })
        },
        onHide: function() {
            getApp().globalData.requestTasks.gainAllSystemConfigLogin && (getApp().globalData.requestTasks.gainAllSystemConfigLogin.abort(), console.log(" ===  abort() === gainAllSystemConfigLogin"))
        },
        onUnload: function() {
            getApp().globalData.requestTasks.gainAllSystemConfigLogin && (getApp().globalData.requestTasks.gainAllSystemConfigLogin.abort(), console.log(" ===  abort() === gainAllSystemConfigLogin"))
        },
        onPullDownRefresh: function() {},
        onReachBottom: function() {},
        onShareAppMessage: function() {}
    });
});
require("subPages/ticket/personal/index/index.js");
__wxRoute = 'subPages/ticket/personal/fillInfo/fillInfo';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/personal/fillInfo/fillInfo.js';
define("subPages/ticket/personal/fillInfo/fillInfo.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var t = require("../../../../@babel/runtime/helpers/interopRequireDefault").default,
        e = require("../../../../@babel/runtime/helpers/createForOfIteratorHelper"),
        a = t(require("@vant/weapp/toast/toast")),
        i = require("../../../../api/api_ticket"),
        c = require("../../../../api/api_user.js"),
        r = require("../../utils/utils"),
        n = require("../../utils/recommend"),
        l = require("../../../../api/globalData.js"),
        d = getApp();
    Page({
        data: {
            base_url: l.ticketUrl,
            scheduleList: [],
            scheduleId: "",
            schedule: {},
            checked: !1,
            tableData: [],
            contactList: [],
            ticketList: [],
            hallSetting: {},
            personObj: {
                name: "",
                card_type: "",
                card_type2: "",
                card_id: "",
                ticket_name: "",
                price: "0.00",
                priceId: "",
                ticketList: [],
                isChild: !1
            },
            cardTypeList: [],
            totalPrice: "0.00",
            followerEnable: !1,
            repeatCertificateNumber: "",
            dialogShow: !1,
            ticketTip: "",
            noTicket: !1,
            realNameInfo: ""
        },
        onLoad: function(t) {
            var e = this;
            console.log(d.globalData.ticketTempData);
            var a = d.globalData.ticketAllSystemConfig.hallPoolRangeVOList.find((function(t) {
                    return t.hallId == d.globalData.ticketTempData.hallId
                })),
                i = d.globalData.ticketTempData.hallId,
                r = !1;
            1 == d.globalData.ticketAllSystemConfig.followerSettingVoList.filter((function(t) {
                return t.hallId.toString() === i.toString()
            }))[0].followerEnable && (r = !0), this.setData({
                scheduleList: d.globalData.ticketTempData.scheduleList,
                schedule: d.globalData.ticketTempData.schedule,
                scheduleId: d.globalData.ticketTempData.scheduleId,
                hallSetting: a,
                followerEnable: r
            }), this.initTicketList(), wx.getStorageSync("realNameInfo") ? this.setData({
                realNameInfo: wx.getStorageSync("realNameInfo") || ""
            }) : (0, c.get_users_isReal)().then((function(t) {
                wx.setStorage({
                    key: "realNameInfo",
                    data: t.data
                }), e.setData({
                    realNameInfo: t.data
                })
            })), this.getPersonList()
        },
        getPersonList: function() {
            var t = this,
                e = this.data.realNameInfo,
                a = {
                    certificateNumber: e.certificateInfo,
                    certificateType: e.certificate,
                    certificateTypeName: e.certificateName,
                    contactId: 99999999,
                    name: e.userName,
                    nationality: null,
                    nationalityName: null
                },
                c = [];
            (0, i.get_gainUserContacterList)().then((function(i) {
                if (e.certificate && 98 != e.certificate) {
                    if (i.data && i.data.length > 0) {
                        var r = i.data.filter((function(t) {
                            return t.certificateNumber !== e.certificateInfo
                        }));
                        c = r
                    }
                    c.unshift(a), t.setData({
                        contactList: c
                    })
                } else t.setData({
                    contactList: i.data && i.data.length > 0 ? i.data : []
                })
            }))
        },
        initTicketList: function() {
            var t = this,
                c = this.data.schedule,
                r = c.hallId,
                n = c.hallScheduleId,
                l = c.currentDate;
            (0, i.get_Price_By_ScheduleId)(r, n, l.replace(/-/g, "/"), 1, d.globalData.secretkey ? 12 : 1).then((function(i) {
                var c, r = !0,
                    n = e(i.data);
                try {
                    for (n.s(); !(c = n.n()).done;) {
                        var l = c.value;
                        l.canCheck = !0, 4 == l.status && (r = !1)
                    }
                } catch (t) {
                    n.e(t)
                } finally {
                    n.f()
                }
                var d = [];
                i.data[0].certificateVOS.forEach((function(t) {
                    d.push({
                        value: t.id + "",
                        label: t.name
                    })
                })), t.data.personObj.ticketList = JSON.parse(JSON.stringify(i.data)), t.data.personObj.card_type = d[0].value, t.data.personObj.card_type2 = d[0].label;
                var s = t.data.tableData;
                (s = []).push(JSON.parse(JSON.stringify(t.data.personObj))), t.setData({
                    ticketList: i.data,
                    cardTypeList: d,
                    tableData: s,
                    noTicket: r
                }), r && (0, a.default)("预约已满，无可预约名额")
            })).catch((function(e) {
                setTimeout((function() {
                    t.initTicketList()
                }), 2e3)
            }))
        },
        onChange: function(t) {
            this.setData({
                checked: t.detail
            })
        },
        clickContact: function(t) {
            var e = this;
            console.log(t.detail);
            var i = t.detail,
                c = i.val,
                l = i.index,
                d = this.data,
                s = d.tableData,
                o = d.contactList;
            if (c.checked) {
                console.log("点击常用联系人取消相关的游客信息"), o[l].checked = !1;
                for (var h = 0; h < s.length; h++)
                    if (s[h].card_id == c.certificateNumber) {
                        s.splice(h, 1), 0 == s.length && s.push(JSON.parse(JSON.stringify(this.data.personObj)));
                        break
                    }
            } else {
                console.log("自动添加常用联系人到游客信息填写列表(如果有空位)");
                var u, f = !1,
                    p = function(t) {
                        if (s[t].card_id == c.certificateNumber) return {
                            v: void 0
                        };
                        if (!(0, r.hasContent)(s[t].name) && !(0, r.hasContent)(s[t].card_id)) {
                            console.log("有空位"), s[t].name = c.name, s[t].card_type = c.certificateType, e.data.cardTypeList.forEach((function(e) {
                                e.value == c.certificateType && (s[t].card_type2 = e.label)
                            })), s[t].card_id = c.certificateNumber, s[t].contactId = o[l].contactId, o[l].checked = !0;
                            var a = (0, n.smartRecommendTicketFun)(s[t].card_type, s[t].card_id, s[t].ticketList);
                            return s[t].ticketList = a.list, s[t].price = a.ticketPrice, s[t].isChild = a.isChild, s[t].priceId = a.ticketId, s[t].ticket_name = a.ticketName, s[t].isShowTips = a.isShowTips, s[t].tipsText = a.tipsText, e.checkTip(a.ticketId), f = !0, 0
                        }
                    };
                for (var m in s) {
                    if (0 === (u = p(m))) break;
                    if (u) return u.v
                }
                if (!f) {
                    if (!(s.length < this.data.hallSetting.maxPerson)) return void(0, a.default)("超出最大可添加观众人数");
                    var k = JSON.parse(JSON.stringify(this.data.personObj));
                    k.name = c.name, k.card_type = c.certificateType, this.data.cardTypeList.forEach((function(t) {
                        t.value == c.certificateType && (k.card_type2 = t.label)
                    })), k.card_id = c.certificateNumber, k.contactId = o[l].contactId;
                    var g = (0, n.smartRecommendTicketFun)(k.card_type, k.card_id, k.ticketList);
                    k.ticketList = g.list, k.price = g.ticketPrice, k.isChild = g.isChild, k.priceId = g.ticketId, k.ticket_name = g.ticketName, k.isShowTips = g.isShowTips, k.tipsText = g.tipsText, this.checkTip(g.ticketId), o[l].checked = !0, f = !0, s.push(k)
                }
            }
            this.setData({
                tableData: s,
                contactList: o
            }), this.calcPrice()
        },
        pickCardType: function(t) {
            console.log(t.detail);
            var e = t.detail,
                a = e.cardTypeIndex,
                i = e.tableDataIndex,
                c = this.data,
                r = c.tableData,
                n = c.cardTypeList;
            if (r[i].card_type != n[a].value) {
                r[i].card_type = n[a].value, r[i].card_type2 = n[a].label;
                var l = {
                    detail: {
                        tableDataIndex: i,
                        val: ""
                    }
                };
                this.inputCardId(l), this.setData({
                    tableData: r
                })
            }
        },
        inputName: function(t) {
            var e = t.detail,
                a = e.tableDataIndex,
                i = e.val,
                c = this.data.tableData;
            c[a].name = i, this.setData({
                tableData: c
            })
        },
        inputCardId: function(t) {
            var e = t.detail,
                a = e.tableDataIndex,
                i = e.val,
                c = this.data,
                r = c.tableData,
                l = c.contactList;
            if (r[a].card_id = i.replace(/[^\w_]/g, "").toUpperCase(), console.log(r[a]), r[a].contactId) {
                var d = l.findIndex((function(t) {
                    return t.contactId == r[a].contactId
                }));
                l[d].certificateNumber != r[a].card_id && (r[a].contactId = "", l[d].checked = !1)
            } else {
                var s = l.findIndex((function(t) {
                    return t.certificateNumber == r[a].card_id
                }));
                s >= 0 && (r[a].contactId = l[s].contactId, r[a].name = l[s].name, r[a].card_type = l[s].certificateType, r[a].card_type2 = l[s].certificateTypeName, l[s].checked = !0)
            }
            var o = (0, n.smartRecommendTicketFun)(r[a].card_type, r[a].card_id, r[a].ticketList);
            console.log(o, "temptemptemptemptemptemptemptemp"), r[a].ticketList = o.list, r[a].price = o.ticketPrice, r[a].isChild = o.isChild, r[a].priceId = o.ticketId, r[a].ticket_name = o.ticketName, r[a].isShowTips = o.isShowTips, r[a].tipsText = o.tipsText, this.checkTip(o.ticketId), this.setData({
                tableData: r,
                contactList: l
            }), this.calcPrice()
        },
        ticketChange: function(t) {
            if (this.data.noTicket)(0, a.default)("预约已满，无可预约名额");
            else {
                var e = t.detail,
                    i = e.tableDataIndex,
                    c = e.priceId,
                    r = this.data.tableData,
                    n = r[i].ticketList.find((function(t) {
                        return t.priceId == c
                    }));
                r[i].priceId = n.priceId, r[i].price = n.price, r[i].ticket_name = n.priceName, r[i].isChild = n.child, this.checkTip(n.priceId), this.setData({
                    tableData: r
                }), this.calcPrice()
            }
        },
        calcPrice: function() {
            var t = this.data.tableData,
                e = 0;
            t.forEach((function(t) {
                e += Number(t.price)
            })), e = (0, r.keepTwoDecimalFull)(e), console.log("---totalPrice", e), this.setData({
                totalPrice: e
            })
        },
        delPerson: function(t) {
            console.log(t);
            var e = t.detail,
                a = this.data,
                i = a.tableData,
                c = a.contactList,
                r = a.personObj;
            if (i[e].card_id) {
                var n = c.find((function(t) {
                    return t.certificateNumber == i[e].card_id
                }));
                n && (n.checked = !1)
            }
            i.splice(e, 1), 0 == i.length && i.push(JSON.parse(JSON.stringify(r))), this.setData({
                tableData: i,
                contactList: c
            }), this.calcPrice()
        },
        addPerson: function() {
            var t = this.data,
                e = t.tableData,
                a = t.hallSetting,
                i = t.personObj;
            e.length < a.maxPerson && (e.push(JSON.parse(JSON.stringify(i))), this.setData({
                tableData: e
            })), this.calcPrice()
        },
        ocrInput: function(t) {
            var e = this,
                c = (this.data.tableData, t.detail),
                r = c.file,
                n = c.index;
            wx.getFileSystemManager().readFile({
                filePath: r.url,
                encoding: "base64",
                success: function(t) {
                    var c = {
                        ocrType: 1,
                        imageData: t.data
                    };
                    (0, i.post_ocr)(c).then((function(t) {
                        if (t.data.cardNumber) {
                            var i = {
                                detail: {
                                    tableDataIndex: n,
                                    val: t.data.cardNumber
                                }
                            };
                            e.inputCardId(i);
                            var c = {
                                detail: {
                                    tableDataIndex: n,
                                    val: t.data.name
                                }
                            };
                            e.inputName(c)
                        } else(0, a.default)("证件识别失败，请重新识别")
                    }))
                }
            })
        },
        next: function() {
            this.data.noTicket ? (0, a.default)("预约已满，无可预约名额") : this.data.tableData.length < 1 || this.checkData() && (this.data.followerEnable ? this.checkPersonMess() : this.goConfirmPage())
        },
        goConfirmPage: function() {
            d.globalData.ticketTempData.tableData = this.data.tableData, d.globalData.ticketTempData.contactList = this.data.contactList, d.globalData.ticketTempData.totalPrice = this.data.totalPrice, wx.navigateTo({
                url: "/subPages/ticket/personal/confirm/confirm"
            })
        },
        checkData: function() {
            for (var t = this.data.tableData, e = 0; e < t.length; e++) {
                var i = t[e];
                if (!(0, r.hasContent)(i.name)) return (0, a.default)("请填写第".concat(e + 1, "名观众的姓名")), !1;
                if (i.name.length < 2) return (0, a.default)("第".concat(e + 1, "名观众姓名请至少输入2个字符")), !1;
                if (!(0, r.hasContent)(i.card_id)) return (0, a.default)("请填写第".concat(e + 1, "名观众的证件号码")), !1;
                if ("1" == i.card_type) {
                    if (!(0, r.checkIdcard)(i.card_id).status) return (0, a.default)("第".concat(e + 1, "名观众的证件号码有误")), !1
                } else if (!(0, r.checkIdcardValid)(i.card_type, i.card_id).status) return (0, a.default)("第".concat(e + 1, "名观众的证件号码有误")), !1;
                if (!(0, r.hasContent)(i.priceId)) return (0, a.default)("请选择第".concat(e + 1, "名观众的凭证类型")), !1
            }
            return !this.checkTicketIdRepeat(t) || ((0, a.default)("存在重复证件号码".concat(this.data.repeatCertificateNumber, "，请检查")), !1)
        },
        checkTicketIdRepeat: function(t) {
            var e = {};
            for (var a in t) {
                if (e[t[a].card_id]) return this.data.repeatCertificateNumber = t[a].card_id, !0;
                e[t[a].card_id] = !0
            }
            return !1
        },
        checkPersonMess: function() {
            var t = this,
                e = this.data,
                a = e.tableData,
                c = e.schedule,
                r = d.globalData.ticketTempData.secretkey,
                n = {
                    useTicketType: 1,
                    ticketNum: a.length || 0,
                    date: c.currentDate,
                    childTicketNum: 0,
                    poolFlag: 1,
                    saleMode: r ? 2 : 1,
                    realNameFlag: 1,
                    platform: r ? 12 : 2,
                    scanToken: r,
                    ticketInfoList: []
                };
            a.forEach((function(t) {
                var e = {
                    status: 0,
                    saleMode: r ? 2 : 1,
                    platform: r ? 12 : 2,
                    hallId: c.hallId,
                    hallScheduleId: c.hallScheduleId,
                    cinemaFlag: 0,
                    ticketPriceId: t.priceId,
                    certificate: t.card_type,
                    certificateInfo: t.card_id,
                    userName: t.name,
                    useDate: c.currentDate + " 00:00:00",
                    isChildFreeTicket: t.isChild ? 1 : 0,
                    realNameFlag: 1
                };
                t.isChild && n.childTicketNum++, n.ticketInfoList.push(e)
            })), console.log(n), wx.showLoading({
                title: "加载中...",
                mask: !0
            }), (0, i.post_check_person)(n).then((function(e) {
                t.goConfirmPage()
            })).finally((function() {
                wx.hideLoading()
            }))
        },
        checkTip: function(t) {
            var e = this.data.ticketList,
                a = e.find((function(e) {
                    return e.priceId == t
                }));
            a && !a.tipShow && a.document && (a.tipShow = !0, wx.hideKeyboard(), this.setData({
                dialogShow: !0,
                ticketTip: a.document,
                ticketList: e
            }))
        },
        dialogConfirm: function() {
            this.setData({
                dialogShow: !1
            })
        },
        onReady: function() {},
        onShow: function() {},
        onHide: function() {},
        onUnload: function() {
            getApp().globalData.requestTasks.getPriceByScheduleId && (getApp().globalData.requestTasks.getPriceByScheduleId.abort(), console.log(" ===  abort() === getPriceByScheduleId"))
        },
        onPullDownRefresh: function() {},
        onReachBottom: function() {},
        onShareAppMessage: function() {}
    });
});
require("subPages/ticket/personal/fillInfo/fillInfo.js");
__wxRoute = 'subPages/ticket/personal/success/success';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/personal/success/success.js';
define("subPages/ticket/personal/success/success.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var e = require("../../../../@babel/runtime/helpers/regeneratorRuntime"),
        t = require("../../../../@babel/runtime/helpers/asyncToGenerator"),
        a = require("../../../../api/globalData.js"),
        n = (require("../../../../api/api_ticket"), getApp());
    Page({
        data: {
            base_url: a.ticketUrl,
            schedule: {},
            tips: "",
            secretkey: ""
        },
        onLoad: function(a) {
            var r = this;
            return t(e().mark((function t() {
                return e().wrap((function(e) {
                    for (;;) switch (e.prev = e.next) {
                        case 0:
                            console.log(n.globalData.ticketTempData.hallData), n.globalData.secretkey, r.setData({
                                schedule: n.globalData.ticketTempData.schedule,
                                tips: n.globalData.ticketTempData.hallData.tips,
                                secretkey: n.globalData.secretkey || null
                            });
                        case 2:
                        case "end":
                            return e.stop()
                    }
                }), t)
            })))()
        },
        goMyOrder: function() {
            wx.reLaunch({
                url: "/subPages/order/order"
            })
        },
        goTicket: function() {
            wx.reLaunch({
                url: "/subPages/ticket/personal/index/index"
            })
        },
        onReady: function() {},
        onShow: function() {},
        onHide: function() {},
        onUnload: function() {},
        onPullDownRefresh: function() {},
        onReachBottom: function() {},
        onShareAppMessage: function() {}
    });
});
require("subPages/ticket/personal/success/success.js");
__wxRoute = 'subPages/ticket/personal/confirm/confirm';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/personal/confirm/confirm.js';
define("subPages/ticket/personal/confirm/confirm.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var e = require("../../../../@babel/runtime/helpers/interopRequireDefault").default,
        t = require("../../../../@babel/runtime/helpers/regeneratorRuntime"),
        a = require("../../../../@babel/runtime/helpers/asyncToGenerator"),
        o = e(require("@vant/weapp/toast/toast")),
        i = require("@/api/globalData.js"),
        n = require("@/api/api_ticket"),
        c = require("@/api/api_user"),
        s = require("../../utils/ase"),
        l = require("../../utils/utils"),
        r = require("../../utils/check"),
        u = require("@/utils/pay.js"),
        d = require("@/utils/captchConfig"),
        p = require("@/utils/common"),
        h = getApp(),
        g = require("../../utils/turingSDK");
    Page({
        data: {
            base_url: i.ticketUrl,
            schedule: {},
            tableData: [],
            totalPrice: 0,
            verifyShow: !1,
            verifyData: {},
            orderData: {},
            payShow: !1,
            userInfo: {},
            followerSettingsTip: "务必准确填写身份信息",
            onlyChild: !1,
            dialogShow: !1,
            childTip: "",
            isAgree: !1,
            load: !1,
            ip: "",
            loadCaptcha: !1,
            captchaId: null,
            mask: {
                outside: !1
            },
            captchResult: null,
            isOpenRequest: !0,
            isShowPayDialog: !1,
            isCanClick: !0
        },
        onLoad: function(e) {
            console.log(h.globalData.ticketTempData.scheduleList), this.setData({
                childTip: h.globalData.ticketAllSystemConfig.copyWriterVoMap.only_child_buy_ticket.parameterDescription || "",
                loadCaptcha: !0,
                captchaId: d.captchaId
            })
        },
        onShow: function() {
            var e = this;
            this.getTuringCoreData(), console.log(h.globalData.ticketTempData), this.getFollowerSettingsTip(), h.globalData.ticketTempData.tableData.forEach((function(e) {
                e.card_id_show = (0, l.desensitization)(e.card_id)
            })), this.setData({
                schedule: h.globalData.ticketTempData.schedule,
                tableData: h.globalData.ticketTempData.tableData,
                totalPrice: h.globalData.ticketTempData.totalPrice
            }), this.checkChild();
            var t = wx.getStorageSync("usersInfo");
            console.log(t), t ? e.data.userInfo = t : (0, c.get_users_info)().then((function(t) {
                e.data.userInfo = t.user, wx.setStorageSync("usersInfo", res.user)
            }))
        },
        getTuringCoreData: function() {
            var e = this;
            return a(t().mark((function a() {
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            e.initTuringCore();
                        case 1:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        initTuringCore: function() {
            var e = wx.getStorageSync("sessions");
            g.init({
                channel: "109045",
                page: this,
                openid: e.openid,
                implement: {
                    getTouch: function(e) {
                        console.log(e)
                    }
                }
            }, (function(e) {
                0 == e.ret && console.log("初始化成功")
            }))
        },
        getDeviceTokenFun: function() {
            return new Promise((function(e, t) {
                setTimeout((function() {
                    e("")
                }), 3e3), g.getDeviceToken((function(t) {
                    console.log(t, "-----------------------------111111111111111111"), 0 == t.ret ? e(t.deviceToken) : e("")
                }))
            }))
        },
        getFollowerSettingsTip: function() {
            var e = h.globalData.ticketAllSystemConfig.followerSettingVoList,
                t = h.globalData.ticketTempData.hallId,
                a = e.filter((function(e) {
                    return e.hallId.toString() === t.toString()
                }))[0];
            1 == a.followerEnable && this.setData({
                followerSettingsTip: a.tips || "务必准确填写身份信息"
            })
        },
        checkChild: function() {
            var e = h.globalData.ticketAllSystemConfig.systemConfigurationVo.childrenAgeRange;
            (0, r.onlyChild)(this.data.tableData, e) && this.setData({
                onlyChild: !0
            })
        },
        next: function() {
            var e = this,
                t = this;
            if (this.data.isCanClick) {
                if (console.log("点击了"), this.setData({
                        isCanClick: !1
                    }), setTimeout((function() {
                        e.setData({
                            isCanClick: !0
                        })
                    }), 2e3), t.data.load) return console.log("多次点击"), !1;
                t.setData({
                    load: !0
                }), !this.data.isAgree && this.data.onlyChild && h.globalData.ticketAllSystemConfig.copyWriterVoMap.only_child_buy_ticket.showFlag ? this.setData({
                    dialogShow: !0
                }) : wx.requestSubscribeMessage({
                    tmplIds: ["j-AHanhAN2W5hNK4KGOpRQ1vfa56XVU6jzVrkclMAns", "muRX5Xdm3EO-TgKOPMmY35OWarpM0VC0KrTtjWzlRWM"],
                    complete: function() {
                        var e = h.globalData.ticketAllSystemConfig.systemConfigurationVo.hallCaptchaEnable;
                        if (console.log(e), 0 == e) {
                            var a = "https://vv.video.qq.com/checktime?otype=json";
                            wx.request({
                                url: a,
                                success: function(e) {
                                    console.log(e.data);
                                    var a = JSON.parse("{".concat(e.data.split("{")[1].split("}")[0], "}")).ip;
                                    console.log(a), t.setData({
                                        ip: a
                                    }), t.placeOrder()
                                },
                                fail: function(e) {
                                    t.placeOrder()
                                }
                            })
                        } else if (1 == e) t.verifyRefresh();
                        else if (2 == e) {
                            var o = h.globalData.ticketAllSystemConfig.systemConfigurationVo.geetestUseTimeRanges;
                            a = "https://vv.video.qq.com/checktime?otype=json";
                            wx.request({
                                url: a,
                                success: function(e) {
                                    console.log(e.data), console.log(JSON.parse("{".concat(e.data.split("{")[1].split("}")[0], "}")));
                                    var a = JSON.parse("{".concat(e.data.split("{")[1].split("}")[0], "}")),
                                        i = a.ip;
                                    console.log(i), t.setData({
                                        ip: i
                                    });
                                    var n = Number(a.t + "000");
                                    console.log(o, n), (0, p.isInTimeRanges)(o, n) ? t.openCaptcha() : t.verifyRefresh()
                                },
                                fail: function(e) {
                                    (0, p.isInTimeRanges)(o, Date.now()) ? t.openCaptcha(): t.verifyRefresh()
                                }
                            })
                        }
                    }
                })
            }
        },
        openCaptcha: function() {
            requirePlugin("captcha4").showCaptcha()
        },
        verifyClosed: function() {
            this.setData({
                verifyShow: !1
            })
        },
        verifyRefresh: function() {
            var e = this,
                t = h.globalData.ticketTempData,
                a = {
                    nonce: "",
                    platform: h.globalData.secretkey ? 12 : 2
                };
            console.log(t);
            var o = null,
                i = t.chooseDate.replace(/-/g, "/"),
                n = t.hallId,
                c = t.scheduleId,
                l = h.globalData.secretkey ? 12 : 2,
                r = h.globalData.secretkey ? "mjnkHYmu0jpURBTQ" : "AyrKJRXPO3nR5Abc";
            wx.request({
                url: "https://vv.video.qq.com/checktime?otype=json",
                success: function(t) {
                    console.log(t);
                    var u = JSON.parse("{".concat(t.data.split("{")[1].split("}")[0], "}")),
                        d = u.ip;
                    console.log(d), e.setData({
                        ip: d
                    }), o = u.t + "000", console.log("".concat(e.data.userInfo.userId, ":").concat(o, ":").concat(i, ":").concat(n, ":").concat(c, ":").concat(l)), a.nonce = (0, s.aesEncrypt)("".concat(e.data.userInfo.userId, ":").concat(o, ":").concat(i, ":").concat(n, ":").concat(c, ":").concat(l), r), console.log(a), e.getVerifyCode(a)
                },
                fail: function(t) {
                    o = Date.parse(new Date), console.log("".concat(e.data.userInfo.userId, ":").concat(o, ":").concat(i, ":").concat(n, ":").concat(c, ":").concat(l)), a.nonce = (0, s.aesEncrypt)("".concat(e.data.userInfo.userId, ":").concat(o, ":").concat(i, ":").concat(n, ":").concat(c, ":").concat(l), r), console.log(a), e.getVerifyCode(a)
                }
            })
        },
        getVerifyCode: function(e) {
            var t = this;
            (0, n.get_verify_code)(e).then((function(e) {
                t.setData({
                    verifyShow: !0,
                    verifyData: e.data
                })
            })).catch((function(e) {
                setTimeout((function() {
                    500003 == e.data.errorCode && (h.globalData.secretkey ? wx.reLaunch({
                        url: "/subPages/ticket/personal/index/index?secretkey=" + h.globalData.secretkey
                    }) : wx.reLaunch({
                        url: "/subPages/ticket/personal/index/index"
                    }))
                }), 2e3)
            })).finally((function() {
                t.setData({
                    load: !1
                })
            }))
        },
        placeOrder: function(e) {
            var i = this;
            return a(t().mark((function a() {
                var c, l, r, d, p, g, f, y, D, k;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            if (i.setData({
                                    load: !0
                                }), !i.data.isOpenRequest) {
                                t.next = 7;
                                break
                            }
                            return t.next = 4, i.getDeviceTokenFun();
                        case 4:
                            t.t0 = t.sent, t.next = 8;
                            break;
                        case 7:
                            t.t0 = "";
                        case 8:
                            c = t.t0, l = i, r = i.data, d = r.tableData, p = r.schedule, g = h.globalData.secretkey, f = {
                                useTicketType: 1,
                                ticketNum: d.length || 0,
                                date: p.currentDate,
                                childTicketNum: 0,
                                poolFlag: 1,
                                saleMode: g ? 2 : 1,
                                realNameFlag: 1,
                                pointJson: "",
                                captchaToken: "",
                                platform: g ? 12 : 2,
                                scanToken: g,
                                ticketInfoList: [],
                                deviceToken: c
                            }, e && (console.log("验证码点位："), console.log(e.detail), f.pointJson = i.data.verifyData.secretKey ? (0, s.aesEncrypt)(JSON.stringify(e.detail.pointJson), i.data.verifyData.secretKey) : JSON.stringify(e.detail.pointJson), f.captchaToken = e.detail.token), h.globalData.ticketAllSystemConfig.systemConfigurationVo.hallCaptchaEnable, (y = i.data.captchResult) && (f.captchaOutput = y.captcha_output, f.genTime = y.gen_time, f.lotNumber = y.lot_number, f.passToken = y.pass_token), d.forEach((function(e) {
                                var t = {
                                    status: 0,
                                    saleMode: g ? 2 : 1,
                                    platform: g ? 12 : 2,
                                    hallId: p.hallId,
                                    hallScheduleId: p.hallScheduleId,
                                    cinemaFlag: 0,
                                    ticketPriceId: e.priceId,
                                    certificate: e.card_type,
                                    certificateInfo: e.card_id,
                                    userName: e.name,
                                    useDate: p.currentDate + " 00:00:00",
                                    isChildFreeTicket: e.isChild ? 1 : 0,
                                    realNameFlag: 1
                                };
                                e.isChild && f.childTicketNum++, f.ticketInfoList.push(t)
                            })), D = "", l.data.ip && ("AyrKJRXPO3nR5Abc", "mjnkHYmu0jpURBTQ", k = h.globalData.secretkey ? "mjnkHYmu0jpURBTQ" : "AyrKJRXPO3nR5Abc", D = (0, s.aesEncrypt)("".concat(l.data.ip), k)), console.log(f, "最后提交的数据数据最后提交的数据数据最后提交的数据数据最后提交的数据数据最后提交的数据数据"), (0, n.post_submit_order)(f, D).then((function(e) {
                                if (0 == e.data.needChargeCode) l.setData({
                                    verifyShow: !1
                                }), e.data.riskEnable ? (1 == e.data.riskPolicy && wx.reLaunch({
                                    url: "/subPages/ticket/personal/success/success"
                                }), 0 == e.data.riskPolicy && ((0, o.default)(e.data.prompt), i.setData({
                                    load: !0
                                }), setTimeout((function() {
                                    wx.reLaunch({
                                        url: "/subPages/ticket/personal/index/index"
                                    })
                                }), 1500)), 3 == e.data.riskPolicy && wx.navigateTo({
                                    url: "/pages/face/index?identityId=" + e.data.identityId
                                })) : wx.reLaunch({
                                    url: "/subPages/ticket/personal/success/success"
                                });
                                else {
                                    l.setData({
                                        orderData: e.data,
                                        verifyShow: !1
                                    });
                                    var t = {
                                        id: e.data.orderId,
                                        payType: 22,
                                        payChannel: 5,
                                        miniOpenId: wx.getStorageSync("sessions").openid
                                    };
                                    e.data.riskEnable ? (1 == e.data.riskPolicy && (0, u.pullPayment)(t).then((function() {
                                        l.setData({
                                            isShowPayDialog: !0
                                        }), setTimeout((function() {
                                            wx.reLaunch({
                                                url: "/subPages/ticket/personal/success/success"
                                            })
                                        }), 3e3)
                                    })).catch((function() {
                                        console.log("支付失败"), l.gotoOrderList()
                                    })), 0 == e.data.riskPolicy && ((0, o.default)(e.data.prompt), i.setData({
                                        load: !0
                                    }), setTimeout((function() {
                                        wx.reLaunch({
                                            url: "/subPages/ticket/personal/index/index"
                                        })
                                    }), 1500)), 3 == e.data.riskPolicy && wx.navigateTo({
                                        url: "/pages/face/index?identityId=" + e.data.identityId + "&orderId=" + e.data.orderId
                                    })) : (0, u.pullPayment)(t).then((function() {
                                        l.setData({
                                            isShowPayDialog: !0
                                        }), setTimeout((function() {
                                            wx.reLaunch({
                                                url: "/subPages/ticket/personal/success/success"
                                            })
                                        }), 3e3)
                                    })).catch((function() {
                                        console.log("支付失败"), l.gotoOrderList()
                                    }))
                                }
                            })).catch((function(e) {
                                setTimeout((function() {
                                    if (550 == e.data.code) 500003 == e.data.errorCode ? l.goHome() : wx.navigateBack();
                                    else if (506 == e.data.code) l.goHome();
                                    else {
                                        if (l.data.captchResult) l.setData({
                                            captchResult: null
                                        }), requirePlugin("captcha4").showCaptcha();
                                        else l.verifyRefresh()
                                    }
                                }), 2e3)
                            })).finally((function() {
                                l.setData({
                                    load: !1
                                })
                            }));
                        case 22:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        goHome: function() {
            this.setData({
                load: !0
            }), h.globalData.secretkey ? wx.reLaunch({
                url: "/subPages/ticket/personal/index/index?secretkey=" + h.globalData.secretkey
            }) : wx.reLaunch({
                url: "/subPages/ticket/personal/index/index"
            })
        },
        onClose: function(e) {
            console.log("onClose", e.detail);
            var t = this;
            1 == e.detail.payState ? (t.setData({
                payShow: !1
            }), (0, o.default)("订单超时未支付已自动取消，请重新下单"), setTimeout((function() {
                o.default.clear(), t.gotoOrderList()
            }), 3e3)) : 2 == e.detail.payState ? (t.setData({
                payShow: !1
            }), this.data.orderData.riskEnable ? wx.reLaunch({
                url: "/subPages/ticket/personal/riskgo/riskgo?orderId=" + this.data.orderData.orderId
            }) : wx.reLaunch({
                url: "/subPages/ticket/personal/success/success"
            })) : (t.setData({
                payShow: !1
            }), t.gotoOrderList())
        },
        gotoOrderList: function() {
            wx.reLaunch({
                url: "/subPages/order/order"
            })
        },
        dialogCancel: function() {
            this.setData({
                dialogShow: !1,
                load: !1
            })
        },
        dialogConfirm: function() {
            this.setData({
                dialogShow: !1,
                isAgree: !0,
                load: !1
            }), this.next()
        },
        captchaSuccess: function(e) {
            console.log("captcha-Success!", e), this.setData({
                captchResult: e.detail
            }), this.placeOrder()
        },
        captchaError: function(e) {
            console.log("captcha-Error!", e.detail), e.detail.code
        },
        captchaClose: function() {
            console.log("captcha-Close!"), this.setData({
                load: !1
            })
        },
        onHide: function() {},
        onUnload: function() {},
        onPullDownRefresh: function() {},
        onReachBottom: function() {},
        onShareAppMessage: function() {}
    });
});
require("subPages/ticket/personal/confirm/confirm.js");
__wxRoute = 'subPages/ticket/personal/riskgo/riskgo';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/personal/riskgo/riskgo.js';
define("subPages/ticket/personal/riskgo/riskgo.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var t = require("../../../../api/globalData.js"),
        o = require("../../../../api/api_ticket");
    Page({
        data: {
            base_url: t.ticketUrl,
            timeout: null
        },
        onLoad: function(t) {
            var o = this;
            if (t.orderId) {
                var a = t.orderId;
                o.data.timeout = setTimeout((function() {
                    o.riskgo(a)
                }), 2e3)
            }
        },
        riskgo: function(t) {
            var a = this;
            (0, o.get_riskgo)(t).then((function(o) {
                2 == o.data ? wx.reLaunch({
                    url: "/subPages/ticket/personal/success/success"
                }) : 22 == o.data ? wx.reLaunch({
                    url: "/pages/busy/index?type=2"
                }) : a.data.timeout = setTimeout((function() {
                    a.riskgo(t)
                }), 2e3)
            }))
        },
        onReady: function() {},
        onShow: function() {},
        onHide: function() {
            getApp().globalData.requestTasks.riskgo && (getApp().globalData.requestTasks.riskgo.abort(), console.log(" ===  abort() === riskgo")), this.data.timeout && clearTimeout(this.data.timeout)
        },
        onUnload: function() {
            getApp().globalData.requestTasks.riskgo && (getApp().globalData.requestTasks.riskgo.abort(), console.log(" ===  abort() === riskgo")), this.data.timeout && clearTimeout(this.data.timeout)
        },
        onPullDownRefresh: function() {},
        onReachBottom: function() {},
        onShareAppMessage: function() {}
    });
});
require("subPages/ticket/personal/riskgo/riskgo.js");
__wxRoute = 'subPages/ticket/notice/list';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/notice/list.js';
define("subPages/ticket/notice/list.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var n = require("../../../api/globalData.js"),
        t = getApp();
    Page({
        data: {
            base_url: n.ticketUrl,
            announcementInfoVOList: []
        },
        click: function(n) {
            console.log(n);
            var t = n.currentTarget.dataset.id;
            wx.navigateTo({
                url: "/subPages/ticket/notice/detail?id=" + t
            })
        },
        onLoad: function(n) {
            this.setData({
                announcementInfoVOList: t.globalData.ticketAllSystemConfig.announcementInfoVOList
            })
        },
        onReady: function() {},
        onShow: function() {},
        onHide: function() {},
        onUnload: function() {},
        onPullDownRefresh: function() {},
        onReachBottom: function() {},
        onShareAppMessage: function() {}
    });
});
require("subPages/ticket/notice/list.js");
__wxRoute = 'subPages/ticket/notice/detail';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/notice/detail.js';
define("subPages/ticket/notice/detail.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var t = require("../../../api/api_ticket"),
        i = require("../../../api/globalData.js"),
        e = require("../utils/utils");
    Page({
        data: {
            base_url: i.ticketUrl,
            detail: {}
        },
        onLoad: function(t) {
            this.getNoticeDetail(t.id)
        },
        getNoticeDetail: function(i) {
            var a = this;
            (0, t.get_notice_detail)(i).then((function(t) {
                t.data.publishTime = (0, e.datefmt)(t.data.publishTime, "YYYY年MM月DD日"), a.setData({
                    detail: t.data
                })
            }))
        },
        onReady: function() {},
        onShow: function() {},
        onHide: function() {},
        onUnload: function() {},
        onPullDownRefresh: function() {},
        onReachBottom: function() {},
        onShareAppMessage: function() {}
    });
});
require("subPages/ticket/notice/detail.js");
__wxRoute = 'subPages/ticket/personal/realName/index';
__wxRouteBegin = true;
__wxAppCurrentFile__ = 'subPages/ticket/personal/realName/index.js';
define("subPages/ticket/personal/realName/index.js", function(require, module, exports, window, document, frames, self, location, navigator, localStorage, history, Caches, screen, alert, confirm, prompt, XMLHttpRequest, WebSocket, Reporter, webkit, WeixinJSCore) {
    "use strict";
    var e = require("../../../../@babel/runtime/helpers/interopRequireDefault").default,
        t = require("../../../../@babel/runtime/helpers/regeneratorRuntime"),
        a = require("../../../../@babel/runtime/helpers/asyncToGenerator"),
        r = require("../../../../@babel/runtime/helpers/defineProperty"),
        i = e(require("@vant/weapp/toast/toast")),
        o = require("@/api/api_index.js"),
        s = require("@/api/api_user"),
        n = require("@/api/api_ticket"),
        c = require("@/utils/utils"),
        u = require("@/utils/ase"),
        l = require("@/api/globalData.js"),
        f = getApp();
    Page({
        data: {
            base_url: l.ticketUrl,
            userIdKey: "",
            certifyId: "",
            isRequest: !1,
            realNameList: [],
            cardTypeList: [],
            form: {
                certype: 1,
                certypeName: "身份证",
                realName: "",
                platform: ""
            },
            certNo: "",
            certName: "",
            showSuccessDialog: !1,
            showRepeatDialog: !1,
            reasonOfBind: "该身份信息已被【手机号】绑定，点击下一步将进行实名认证，实名认证通过后实名信息将与原账号解除绑定并绑定到该账号",
            bottom_tips: "",
            redirectUrl: "",
            isNeedQuery: "",
            realTips: "",
            unBindbutton: 0,
            isSao: !1
        },
        onLoad: function(e) {
            this.setting(), wx.setNavigationBarTitle({
                title: "实名认证"
            }), this.setData({
                redirectUrl: e.redirect ? e.redirect : "",
                isNeedQuery: e.isNeedQuery ? e.isNeedQuery : ""
            }), e.isSao && this.setData({
                isSao: !0
            });
            var t = this;
            (0, n.get_ticket_real_system_config)().then((function(e) {
                t.setData({
                    unBindbutton: e.data.u
                })
            }))
        },
        beforCloseDialog: function(e) {
            this.setData({
                isRequest: !1
            })
        },
        closeRepeatDialog: function() {
            this.setData({
                showRepeatDialog: !1
            })
        },
        setting: function() {
            var e = this;
            (0, n.get_ticket_all_system_config)().then((function(t) {
                e.setData({
                    bottom_tips: t.data.copyWriterVoMap.real_name_authentication_messages
                })
            })), (0, o.getAllRealNameAuthMode)().then((function(t) {
                var a = [];
                t.data[0].entities.forEach((function(e) {
                    a.push(JSON.parse(e))
                })), e.setData({
                    realNameList: t.data,
                    cardTypeList: a
                })
            }))
        },
        hasPropertyValue: function(e, t, a) {
            return e.some((function(e) {
                return e[t] === a
            }))
        },
        changeCerType: function(e) {
            console.log(e);
            var t = this.data,
                a = t.cardTypeList,
                i = t.form,
                o = e.detail.value;
            i.certype != a[o].value && this.setData(r(r({}, "form.certype", a[o].value), "form.certypeName", a[o].label))
        },
        chooseWay: function(e) {
            console.log(e);
            var t = e.currentTarget.dataset.way,
                a = [];
            t.entities.forEach((function(e) {
                a.push(JSON.parse(e))
            })), this.setData(r(r(r(r(r({}, "form.platform", t.type), "form.realName", t.typeLabel), "cardTypeList", a), "realTips", t.tips), "isRequest", !1)), this.data.form.certype != a[0].value && this.setData({
                certName: "",
                certNo: ""
            }), this.setData(r(r({}, "form.certype", a[0].value), "form.certypeName", a[0].label))
        },
        get_checkCerNoIsRealName: function(e) {
            var t = this;
            return new Promise((function(a, r) {
                (0, o.checkCerNoIsRealName)(e).then((function(e) {
                    a(e)
                })).catch((function(e) {
                    t.setData({
                        isRequest: !1
                    }), r(e)
                }))
            }))
        },
        next: function() {
            var e = this;
            return a(t().mark((function a() {
                var r, i, o, s, n, u, l, f, d, p, h, m;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            if (r = e.data, i = r.certNo, o = r.certName, s = r.isRequest, n = r.form, !s) {
                                t.next = 3;
                                break
                            }
                            return t.abrupt("return");
                        case 3:
                            if (e.setData({
                                    isRequest: !0
                                }), n.platform) {
                                t.next = 8;
                                break
                            }
                            return wx.showToast({
                                title: "请选择认证方式",
                                icon: "none"
                            }), e.setData({
                                isRequest: !1
                            }), t.abrupt("return");
                        case 8:
                            if (o) {
                                t.next = 12;
                                break
                            }
                            return wx.showToast({
                                title: "请输入姓名",
                                icon: "none"
                            }), e.setData({
                                isRequest: !1
                            }), t.abrupt("return");
                        case 12:
                            if (1 != n.certype) {
                                t.next = 20;
                                break
                            }
                            if (u = (0, c.checkIdcard)(i), l = u.status, f = u.msg, l) {
                                t.next = 18;
                                break
                            }
                            return wx.showToast({
                                title: f + " !",
                                icon: "none"
                            }), e.setData({
                                isRequest: !1
                            }), t.abrupt("return");
                        case 18:
                            t.next = 25;
                            break;
                        case 20:
                            if (d = (0, c.checkIdcardValid)(n.certype, i), p = d.status, h = d.errtips, p) {
                                t.next = 25;
                                break
                            }
                            return wx.showToast({
                                title: h + " !",
                                icon: "none"
                            }), e.setData({
                                isRequest: !1
                            }), t.abrupt("return");
                        case 25:
                            return t.next = 27, e.get_checkCerNoIsRealName(i);
                        case 27:
                            if (m = t.sent, console.log(m, "11111"), m.data) {
                                t.next = 32;
                                break
                            }
                            return e.setData({
                                reasonOfBind: m.msg,
                                showRepeatDialog: !0,
                                isRequest: !1
                            }), t.abrupt("return");
                        case 32:
                            e.getCertifyId();
                        case 33:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        getCertifyId: function() {
            var e = this,
                t = this.data,
                a = t.form,
                r = t.certNo,
                i = {
                    certName: t.certName,
                    certNo: r,
                    certType: a.certype,
                    platform: a.platform,
                    miniOpenId: wx.getStorageSync("sessions").openid
                };
            2 == a.platform ? (this.setData({
                showRepeatDialog: !1
            }), this.initWechatPay()) : (0, o.getRealName_Data)(i).then((function(t) {
                e.setData({
                    userIdKey: t.data.certifyId
                }), 1 == a.platform ? e.startFacialRecognition() : 4 == a.platform && (e.setData({
                    showRepeatDialog: !1
                }), e.initServiceFun(t.data))
            }))
        },
        initWechatPay: function() {
            console.log("微信商户支付助手认证");
            var e = wx.getStorageSync("sessions").openid,
                t = this.generateRandom18Digits(18),
                a = "1z2x3c4v5bqawsedrftgynumiop10293",
                r = "api_version=1.0&appid=wx9e2927dd595b0473&mch_id=1525668071&nonce_str=".concat(t, "&openid=").concat(e, "&response_type=code&scope=pay_identity&sign_type=HMAC-SHA256") + "&key=" + a,
                i = (0, u.generateSignature)(a, r).toUpperCase();
            wx.navigateToMiniProgram({
                appId: "wx88736d7d39e2eda6",
                path: "pages/oauth/authindex",
                extraData: {
                    api_version: "1.0",
                    mch_id: "1525668071",
                    appid: "wx9e2927dd595b0473",
                    scope: "pay_identity",
                    response_type: "code",
                    openid: e,
                    sign_type: "HMAC-SHA256",
                    sign: i,
                    nonce_str: t
                },
                success: function(e) {
                    console.log(e, "跳转微信支付成功")
                },
                fail: function(e) {
                    console.log(e, "跳转微信支付失败")
                }
            })
        },
        generateRandom18Digits: function(e) {
            for (var t = "", a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", r = a.length, i = 0; i < e; i++) t += a.charAt(Math.floor(Math.random() * r));
            return t
        },
        startFacialRecognition: function() {
            var e = this,
                t = this;
            wx.checkIsSupportFacialRecognition({
                checkAliveType: 2,
                success: function(e) {
                    console.log("checkIsSupportFacialRecognition: ", e), "checkIsSupportFacialRecognition:ok" !== e.errMsg || t.startface()
                },
                fail: function(t) {
                    e.setData({
                        isRequest: !1
                    }), wx.showToast({
                        title: "微信版本过低，暂时无法使用此功能，请升级微信最新版本",
                        icon: "none"
                    })
                }
            })
        },
        startface: function() {
            var e = this,
                t = this;
            t.data.userIdKey && wx.startFacialRecognitionVerify({
                userIdKey: t.data.userIdKey,
                success: function(e) {
                    console.log(e, "认证结果");
                    var a = e.verifyResult;
                    console.log("verifyResult: ", a), t.checkVerifyInfo(t.data.userIdKey, a)
                },
                checkAliveType: 2,
                fail: function(t) {
                    e.setData({
                        isRequest: !1
                    }), console.log(t, "22222222222")
                }
            })
        },
        dialogConfirm: function() {
            console.log(this.data.redirectUrl), this.data.redirectUrl ? "/pages/index/index" == decodeURIComponent(this.data.redirectUrl) ? wx.switchTab({
                url: decodeURIComponent(this.data.redirectUrl)
            }) : wx.redirectTo({
                url: decodeURIComponent(this.data.redirectUrl)
            }) : (this.data.isSao && console.log("扫码进入实名认证成功后再返回"), console.log(2), wx.navigateBack())
        },
        checkVerifyInfo: function(e, r) {
            var n = this;
            return a(t().mark((function a() {
                var c, u;
                return t().wrap((function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            return console.log(e, "certifyIdcertifyIdcertifyIdcertifyIdcertifyIdcertifyId", r), n, c = {
                                certifyId: e,
                                platform: n.data.form.platform,
                                verifyResult: r
                            }, t.next = 5, (0, o.getRealName_confirm)(c);
                        case 5:
                            200 == (u = t.sent).code ? ((0, s.get_users_isReal)().then((function(e) {
                                wx.setStorage({
                                    key: "realNameInfo",
                                    data: e.data
                                })
                            })), n.setData({
                                showRepeatDialog: !1,
                                showSuccessDialog: !0
                            })) : (console.log(u, "comfirmDatacomfirmDatacomfirmDatacomfirmDatacomfirmData"), n.setData({
                                showRepeatDialog: !1,
                                isRequest: !1
                            }), (0, i.default)(u.msg)), "50011" == u.code && setTimeout((function() {
                                wx.navigateBack(), n.setData({
                                    isRequest: !1
                                })
                            }), 3e3), n.setData({
                                isRequest: !1
                            });
                        case 9:
                        case "end":
                            return t.stop()
                    }
                }), a)
            })))()
        },
        initServiceFun: function(e) {
            var t = this;
            wx.ncidas({
                orgID: "00000330",
                businessID: "0001",
                bizSeq: e.certifyId,
                type: 0,
                success: function(e) {
                    if (console.log(e, "国家回调"), "C0000000" != e.resultCode) return console.log(e, "国家回调222222222222222222222222222222"), t.setData({
                        isRequest: !1
                    }), (0, i.default)(e.resultDesc), !1;
                    t.checkVerifyInfo(t.data.userIdKey, e.idCardAuthData)
                },
                fail: function(e) {
                    t.setData({
                        isRequest: !1
                    }), console.log(e, "1111111")
                }
            })
        },
        watchName: function(e) {
            if (console.log(e, "eventeventeventevent"), "" == this.data.form.platform) return this.setData({
                certName: ""
            }), void wx.showToast({
                title: "请先选择认证方式",
                icon: "none"
            })
        },
        watchNum: function(e) {
            "" == this.data.form.platform && (this.setData({
                certNo: ""
            }), wx.showToast({
                title: "请先选择认证方式",
                icon: "none"
            }))
        },
        onReady: function() {},
        onShow: function() {
            var e = this;
            if (this.setData({
                    isRequest: !1
                }), 4 != this.data.form.platform && (console.log(this.data.isNeedQuery, "this.data.isNeedQuery"), wx.getStorageSync("realNameInfo") || (0, s.get_users_isReal)(this.data.isNeedQuery).then((function(e) {
                    wx.setStorage({
                        key: "realNameInfo",
                        data: e.data
                    })
                })), f.globalData.referrerInfo.extraData)) {
                var t = f.globalData.referrerInfo.extraData;
                if (f.globalData.referrerInfo = null, "USER_CANCEL" == t.err_code) wx.showToast({
                    title: "用户取消了授权",
                    icon: "none"
                });
                else if (t.auth_code) {
                    var a = this.data,
                        r = a.form,
                        n = a.certNo,
                        c = {
                            certName: a.certName,
                            certNo: n,
                            certType: r.certype,
                            platform: 2,
                            miniOpenId: wx.getStorageSync("sessions").openid,
                            code: t.auth_code
                        };
                    (0, o.getRealName_Data)(c).then((function(t) {
                        0 == t.data.retcode ? e.checkVerifyInfo(t.data.access_token, "") : (0, i.default)(t.data.retmsg), f.globalData.referrerInfo = null
                    }))
                }
            }
        },
        onHide: function() {},
        onUnload: function() {},
        onPullDownRefresh: function() {},
        onReachBottom: function() {},
        onShareAppMessage: function() {}
    });
});
require("subPages/ticket/personal/realName/index.js");