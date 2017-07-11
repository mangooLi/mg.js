let {log}=console



function repArr(expList){
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
    return expList
}

var arr=['arr[a1][a2]','brr[bb]','10']
log(repArr(arr));