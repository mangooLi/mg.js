function $(arg){
    return document.querySelector(arg);
}
function log(arg){
    console.log(arg);
}
var mvv;
window.onload=function(){
     mvv=new MG({
        el:$('#list'),
        data:{
            c:{
                m:25,n:50
            },
            a:10,
            b:20,
            arr:[['arr11','arr12'],20,30],
            e:true,
            f:false
        },
        methods:{
            _alert(){
               [].slice.call(arguments).forEach(function(element) {
                   alert(element);
               }, this);
            }
        }
    });


   $('#btn').onclick=function(){
       mvv.e=!mvv.e;
       mvv.f=!mvv.f;
       mvv.a++;
       mvv.b+=2;
       mvv.c.m+=3;
   }
}

