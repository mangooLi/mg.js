let {log}=console;
var j=0,k=0;
function MV(options){
    this.$options=options;
    let data=this.$data=this.$options.data;
    let methods=this.$methods=this.$options.methods;
    let self=this;
    this.proxyData(self,data,"newMv");
    this.$observer={};

    Object.keys(data).forEach(key=>{
        this.$observer[key]=new Observer(self,key);
    })

    // this.$compile=new Compile(options.el||document.body,this);
}

MV.prototype={
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
                        self.$observer[_key].notify();
                        data[key]=newVal;
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
                        log('data.key== ',data,data[key])
                        return data[key];
                    },
                    set(newVal){
                        if(obj[key]===newVal){return}
                        let _keyName=dataName.split('.')[1];
                        let _key=_keyName?_keyName:key;
                        self.$observer[_key].notify();//观测者发布消息
                        data[key]=newVal;
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
                                self.$observer[_key].notify();
                                data[key]==reNewValue;
                            }
                        })

                        self.proxyData(tempObj,newVal,dataName+'.'+key)
                    }
                })
                
            }
        })
    },


    
    proxyMethod(key){
        let self=this;
         Object.defineProperty(self,key,{
            configurable:false,
            enumerable:true,
            get(){
                return self.$methods[key];
            },
            set(newValue){
                // self.$data[key]=newValue
                console.error('MV 不支持重设置methods');
            }
        })
    }
}

/**
 * @class ObjObserver 
 * 对data属性进行观察
 */
function Observer(mv,key){
   this.$mv=mv;
   this.$prop='mv'+'.'+key;
   this.subs=[];
}
var i=0;
Observer.prototype={
    notify(){
        console.log('notifying',this.$prop,i++)
    }
}

var options={
    data:{
        a:1,
        b:2,
        c:{
            x:10,
            y:20
        }
    }
}
var newMv=new MV(options)

newMv.c.x={
    foo:250,
    bar:{
        baz:20,
        foz:{
            m:10,
            n:{
                h:25
            }
        }
    }
};

newMv.c.x.bar.foz.n.h=260


