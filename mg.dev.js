function MG(options){
    this.$options=options;
    let data=this.$data=this.$options.data;
    let methods=this.$methods=this.$options.methods;
    let self=this;
    this.proxyData(self,data,"newMv");
    this.proxyMethod()
    this.$observer={};

    Object.keys(data).forEach(key=>{
        this.$observer[key]=new Observer(self,key);
    })

    this.$compile=new Compile(options.el||document.body,this);
}

MG.prototype={
    /**
     * 
     * @param {*} obj 被代理的obj，对obj的引用和修改都将指向data
     * @param {*} data 代理data
     */
    proxyData(obj,data,dataName){
        
        var self=this;
        Object.keys(data).forEach(key=>{
            if(typeof data[key]==='object'){//深层次的代理，以便于深层次触发setter事件中的事件
                let tempObj={};
                Object.defineProperty(obj,key,{
                    configurable:true,
                    enumerable:true,
                    get(){
                        return tempObj;
                    },
                    set(newVal){
                        let _keyName=dataName.split('.')[1];
                        let _key=_keyName?_keyName:key;
                        
                        data[key]=newVal;
                        self.$observer[_key].notify();
                        if(typeof newVal==='object'){
                            self.proxyData(tempObj,newVal,dataName+'.'+key);
                        }
                    }
                });
                self.proxyData(tempObj,data[key],dataName+'.'+key);
            
            }else{
            
                Object.defineProperty(obj,key,{
                    configurable:true,
                    enumerable:true,
                    get(){
                        
                        return data[key];
                    },
                    set(newVal){
                        if(obj[key]===newVal){return}
                        let _keyName=dataName.split('.')[1];
                        let _key=_keyName?_keyName:key;
                       
                        data[key]=newVal;
                         self.$observer[_key].notify();//观测者发布消息
                        if(typeof newVal!=='object'){return}

                        let tempObj={};
                        Object.defineProperty(obj,key,{
                            enumerable:true,
                            configurable:true,
                            get(){
                                return tempObj;
                            },
                            set(reNewValue){
                                let _keyName=dataName.split('.')[1];
                                let _key=_keyName?_keyName:key;
                               
                                data[key]==reNewValue;
                                self.$observer[_key].notify();
                            }
                        })

                        self.proxyData(tempObj,newVal,dataName+'.'+key)
                    }
                })
                
            }
        })
    },


    
    proxyMethod(){
        let self=this;
        Object.keys(self.$methods).forEach(key=>{
            Object.defineProperty(self,key,{
                configurable:false,
                enumerable:true,
                get(){
                    return self.$methods[key];
                },
                set(newValue){
                    // self.$data[key]=newValue
                    console.error('MG 不支持重设置methods');
                }
            })
        })
        
    }
}

/**
 * @class ObjObserver 
 * 对data属性进行观察
 */
function Observer(mg,key){
   this.$mg=mg;
   this.$prop='mg'+'.'+key;
   this.subs=[];
}
var i=0;
Observer.prototype={
    notify(){
        // console.log('notifying',this.$prop,i++)
        this.subs.forEach(watcher=>{
            watcher.update();
        })
    }
}




function Compile(el,mg){
    this.$el=el;
    this.$mg=mg;
    if(this.$el){
        this.$fragment = this.nodeFragment(this.$el);
        this.compileElement(this.$fragment);
        this.$el.appendChild(this.$fragment);
    }
}
Compile.prototype = {
    nodeFragment(el){
        let fragment=document.createDocumentFragment();
        let child;
        while(child=el.firstChild){
            fragment.appendChild(child);
        }
        return fragment;
    },
    compileElement(el){
        let self=this;
        let childNodes=el.childNodes;//这里注意一下el.children和childNodes的区别：childNodes会包括空的文本节点

        [].slice.call(childNodes).forEach(node=>{
            let text=node.textContent;
            let reg=/\{\{((?:.|\n)+?)\}\}/g;//匹配{{中间任意字符或者换行符}}
            if(node.nodeType===1){
                self.compile(node);
            }else if(node.nodeType===3&&reg.test(text)){
                self.compileText(node,text.match(reg));//$1表示双大括号中间的表达式
            }

            if(node.childNodes){
                self.compileElement(node);
            }
        })
    },
    compile(node){
        let nodeAttrs=node.attributes;
        let self=this;
        
        // [].splice.call(nodeAttrs).forEach
        for(let i=0;i<nodeAttrs.length;i++){
            let attr=nodeAttrs[i];
            
            let attrName=attr.name;
            let attrValue=attr.value;
            let dir=attrName.substring(2);//如绑定m-model,则dir=='model';
            switch(dir){
                case "model":CompileUtil.compileModel(self,node,attrValue);break;
                case "html":CompileUtil.compileHtml(self,node,attrValue);break;
                case "class":{
                    //针对m-class="{classname01:attrname1,classname02,attrname2}"的情况
                    attrValue=attrValue.replace(/[\{\}]/g,'');
                    let mClassList=attrValue.split(',');
                    mClassList.forEach(mClass=>{
                        let className=mClass.split(':')[0];
                        let attName=mClass.split(':')[1];
                        CompileUtil.compileClass(self,node,attName,className);
                    })
                };break;
                case "click":CompileUtil.compileEvent(self,node,attrValue,"click");break;
                case "change":CompileUtil.compileEvent(self,node,attrValue,"change");break;
                case "input" :CompileUtil.compileEvent(self,node,attrValue,"input");break;
                case "focus" :CompileUtil.compileEvent(self,node,attrValue,"focus");break;
                case "blur" :CompileUtil.compileEvent(self,node,attrValue,"blur");break;
                case "input" :CompileUtil.compileEvent(self,node,attrValue,"input");break;
                case "keyup" :CompileUtil.compileEvent(self,node,attrValue,"keyup");break;
                case "keypress" :CompileUtil.compileEvent(self,node,attrValue,"keypress");break;
                case "keydown" :CompileUtil.compileEvent(self,node,attrValue,"keydown");break;
            }
            //针对m-class:active="attrname"的情况
            if(dir.indexOf('class:')==0){
                let className=dir.substring(6);
                CompileUtil.compileClass(self,node,attrValue,className);
            }
        }
    },
    compileText(node,expList){
        var self=this;
        CompileUtil.compileText(self,node,expList)
    }
}

CompileUtil={
    timer:null,
    compileText(compile,node,attrValueList){
        var keyList=attrValueList.map(attrValue=>{
            attrValue=attrValue.slice(2,-2);
            
            
            return attrValue;
        })
        new Watcher(compile.$mg,keyList,()=>{
            this.tip=this.tip?this.tip:node.textContent;//将一开始的textContent保留
            // console.log(node.textContent);
            var temp=this.tip;
            keyList.forEach(key=>{
                
                temp=temp.replace(`{{${key}}}`,this.getRelValue(compile.$mg,key));
            })

            node.textContent=temp;
        })
    },
    compileModel(compile,node,attrValue){
        var key=attrValue.split('.')?attrValue.split('.')[0]:attrValue
        var oldVal=this.getRelValue(compile.$mg,attrValue);
       
        node.addEventListener('input',e=>{
            let newVal=e.target.value;
            let $elm=e.target;
            if(oldVal===newVal){return};
            clearTimeout(this.timer);

            this.timer=setTimeout(()=>{
                this.setRelValue(compile.$mg,attrValue,newVal);
            })

            
        })
        new Watcher(compile.$mg,key,()=>{
            node.value=this.getRelValue(compile.$mg,attrValue);
            
        })
    },
    compileHtml(compile,node,attrValue){
        var key=attrValue.split('.')?attrValue.split('.')[0]:attrValue
        

        new Watcher(compile.$mg,key,()=>{
            let value=this.getRelValue(compile.$mg,attrValue);
            if(value!==undefined&&value!==null){
                node.innerHTML=value;
            }
        })
        
    },
    compileClass(compile,node,attrValue,className){
        let key=attrValue.split('.')?attrValue.split('.')[0]:attrValue
        
        new Watcher(compile.$mg,key,()=>{
            let value=this.getRelValue(compile.$mg,attrValue);
            if(Boolean(value)&&!node.classList.contains(className)){
                node.classList.add(className);
            }else{
                if(node.classList.contains(className)){
                    node.classList.remove(className)
                }
            }
        })
    },
    compileEvent(compile,node,attrValue,eventName){
        attrName=attrValue.replace(/\(.*\)/,"");//从m-click="fnName(para1,para2)"中获取方法名
        paras=attrValue.match(/\((.*?)\)/)[1];//取出'para1,para2'
        var parasList=paras.split(',');
        let tempIndexList=[];
        parasList=parasList.map((para,index)=>{
            if(para.match(/[\'\"].*?[\'\"]/)){//如果para是用单引号或者双引号括起来的，则视为字符串处理
                return para;
            }else if(!isNaN(Number(para))){
                return Number(para)
            }else{
                var data=this.getRelValue(compile.$mg,para);
                tempIndexList.push({index:index,preKey:para});//做一下标记，哪些参数是和MG对象的属性
                return data;
            }
        })
        fn=compile.$mg[attrName];
        let fifn=fn.bind(compile.$mg,...parasList);
        node.addEventListener(eventName,fifn);
        tempIndexList.forEach(item=>{   //如果某个参数是MG对象的属性，则需要设置watcher
            let preKey=item.preKey;
            let preIndex=item.index;
            let key=preKey.split('.')?preKey.split('.')[0]:preKey;
            //当数据发送变化的时候，重新绑定事件
            new Watcher(compile.$mg,key,()=>{
                parasList[preIndex]=this.getRelValue(compile.$mg,preKey);
                // console.log(fifn);

                node.removeEventListener(eventName,fifn);//之前绑定的事件
                fifn=fn.bind(compile.$mg,...parasList);
                node.addEventListener(eventName,fifn);//重新绑定事件
            })
        })
        if(tempIndexList.length===0){
            node.addEventListener(eventName,fifn);
        }
        
        
    },
    getRelValue(obj,exp){  //处理针对{{a.m.x}}这种情况下获取数据
        
        var expList=exp.split('.');
        let i=0;
        while(i<expList.length){
            let item=expList[i];
            if(item.match(/\[(.*)\]/)){
                let itemP=item.replace(/\[(.*)\]/,'');
                let itemK=item.match(/\[(.*?)\]/g);
                itemK=itemK.map(ik=>{
                    return ik.replace(/\[|\]/g,'');
                })
                log('k=',itemK);
                expList.splice(i,1,itemP,...itemK);
                i+=itemK.length+1;
            }else{
                i++
            }
        }
        for(let i=0;i<expList.length;i++){
            obj=obj[expList[i]];
        }
        
        return obj;
    },
    setRelValue(obj,exp,newVal){//处理针对{{a.m.x}}这种情况设置数据
        var expList=exp.split('.');
        let i=0;
        while(i<expList.length){
            let item=expList[i];
            console.log(item);
            if(item.match(/\[(.*)\]/)){
                let itemP=item.replace(/\[(.*)\]/,'');
                console.log('p= '+itemP);
                let itemK=item.match(/\[(.*?)\]/g);
                itemK=itemK.map(ik=>{
                    return ik.replace(/\[|\]/g,'');
                })
                log('k=',itemK);
                expList.splice(i,1,itemP,...itemK);
                i+=itemK.length+1;
            }else{
                i++
            }
        }
        if(expList.length===1){
            obj[exp]=newVal;
        }else{
            for(let i=0;i<expList.length-1;i++){
                obj=obj[expList[i]];
            }
            obj[expList[expList.length-1]]=newVal
        }
        
    }
}

/**
 * 
 * @param {*} mg MG实例
 * @param {*} prop MG的属性，可以是一个数组
 * @param {*} cb 回调函数
 */
function Watcher(mg,prop,cb){
    
    this.$mg=mg;
    this.prop=prop;
    this.cb=cb;
    if(Array.isArray(prop)){//prop 可以传一个数组
        prop.forEach(item=>{
            item=item.split('.')[0]
            this.sub(mg.$observer[item]);
        })
    }else{
        prop=prop.split('.')[0]
        this.sub(mg.$observer[prop]);
    }
    
    this.cb();


}
Watcher.prototype={
    /**
     * 订阅一个observer，就是把自己加入到被订阅对象的subs中
     * @param {*} observer 观察者
     */
    sub(observer){
        observer.subs.push(this);
    },
    update(){
        this.cb();
    }
}