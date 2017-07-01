var Slashes = (function(){
    function Slashes(program, update, onEnd){
        this.program = program;
        this.$ = [];
        this.running = true;
        this.outputBuffer = "";
        this.outputFunc = function(str){
            this.outputBuffer += str;
        }.bind(this);
        
        this.update = defaultDefined(update, function(next, inst){ next(); });
        this.onEnd = defaultDefined(onEnd, function(inst){ });
    }
    
    var defaultDefined = function defaultDefined(){
        var args = Array.prototype.slice.call(arguments);
        while(typeof args[0] === "undefined" && args.length)
            args.shift();
        return args[0];
    }
    
    // from https://stackoverflow.com/a/3561711/4119004
    var escapeRegex = /[-\/\\^$*+?.()|[\]{}]/g;
    var regexEscape = function regexEscape(str){
        return str.replace(escapeRegex, "\\$&");
    }
    
    var removeEscapes = function removeEscapes(str){
        return str.replace(/\\([\s\S])/g, "$1");
    }
    
    Slashes.prototype.output = function(str){
        this.outputFunc(str);
    }
    
    Slashes.prototype.replaceIf = function replaceIf(regex, replace){
        replace = defaultDefined(replace, "");
        
        var found = false;
        
        var next = this.program.replace(regex, function(){
            var args = Array.prototype.slice.call(arguments);
            args.pop(); // str
            args.pop(); // offset
            this.$ = [];
            while(args.length !== 1){
                this.$.unshift(args.pop());
            }
            var match = args.pop();
            this.$.unshift(match);
            // console.log(this.$, uneval(replace));
            found = true;
            return replace;
        }.bind(this));
        
        if(found)
            this.program = next;
        
        return found;
    }
    
    Slashes.prototype.run = function run(){
        if(!this.running)
            return;
        
        // output text or escape sequences verbatim
        if(this.replaceIf(/^((?:[^/\\]|\s)+)/) || this.replaceIf(/^\\(.)/)){
            this.output(this.$[1]);
            this.update(this.run.bind(this), this);
        }
        
        else if(this.replaceIf(/\/((?:[^/\\]|\\[\s\S])*)\/((?:[^/\\]|\\[\s\S])*)\//)){
            var search = removeEscapes(this.$[1]);
            var replacement = removeEscapes(this.$[2]);
            var searchRegex = new RegExp(regexEscape(search));
            
            var recur = function recur(){
                if(this.replaceIf(searchRegex, replacement)){
                    this.update(recur.bind(this), this);
                } else {
                    this.update(this.run.bind(this), this);
                }
            }.bind(this);
            
            recur();
        }
        
        else {
            this.running = false;
            this.onEnd(function(){ console.log("done running"); }, this);
        }
    }
    
    return Slashes;
})();
