/**
 * Created by seven on 16/3/18.
 */
var oName=$('#name');
var oHost=$('#host');
var oPort=$('#port');
var oMockName=$('#mock-name');
var oMockMessage=$('#mock-message');
var oMockUrl=$('#mock-url');
var mockIndex=-1;
var mockData=[];

//publicMock
$.get('/get/publicmock',function (data) {
    var html=data.map(function(ip,i){
        ip.name=ip.name?ip.name:"公共mock";
        return '<li class="cLi"> <span class="checked">✔</span><a data-index='+i+' class="changeHost" href="#" data-ip='+JSON.stringify(ip)+' >'+ip.name+'</a></li>'
    }).join('');
    $('.public-mock').html(html);
});

function setActiveHost(activeHost) {
    $('.changeHost').each(function (i,element) {
        var data=JSON.parse(element.dataset.ip);
        console.log(data);
        var span=$(element).closest('.cLi').find('span');
        span.removeClass('active');
         if(activeHost.host==data.host&&activeHost.port==data.port){
             span.addClass('active');
         }
    })
}

function getList(){
    var list=localStorage.getItem('hostList')?localStorage.getItem('hostList'):'[]';
    return JSON.parse(list);
}
function showHostList(){
    var list=getList().reverse();
    var html=list.map(function(ip,i){
        return '<li class="cLi"> <span class="checked ">✔</span><a data-index='+i+' class="changeHost" href="#" data-ip='+JSON.stringify(ip)+' >'+ip.host+':'+ip.port+'('+ip.name+')</a><button data-index='+i+' type="button" class="delete-proxy"><span>&times;</span></button></li>'
    }).join('');
    $('.host-list').html(html);
}

function getEntry() {
    $.ajax({
        url:'/page/entry',
        success:function (mes) {
            // <h1 class="text-success">页面</h1>
            //     <h4><a href="/S-Backstage/#">后台</a></h4>
            //     <h4><a href="/S-IM/#">IM</a></h4>
            if(mes){
                var html='<h1 class="text-success">页面</h1>';
                mes.forEach(function (data) {
                    var pageData=data;
                    if(typeof data == 'string') pageData={name:data,href:data};
                    html+='<h4><a href="'+pageData.href+'">'+pageData.name+'</a></h4>';
                })
                document.getElementsByClassName('pageEntry')[0].innerHTML=html;
            }
        }
    })
}
getEntry();
function setList(){
    var hostList=getList();
    var oIp={
        name:oName[0].value?oName[0].value:'',
        host:oHost[0].value,
        port:oPort[0].value
    }
    hostList.push(oIp);
    var hostString=JSON.stringify(hostList);
    localStorage.setItem('hostList',hostString);
}
function setNowHost(obj){
    $('.now-host').html(obj.host+':'+obj.port+'('+obj.name+')');
}
function changeHost(data,index){
    $.ajax({
        data:data,
        url:'/change/host',
        success:function(mes){
            setNowHost(mes);
            setActiveHost(mes);
            getMock()
        }
    });
}
function showMock(list) {
    var html=list.map(function(data,i){
        return ('<tr>'+
        '<td>'+data.name+'('+data.url+')'+'</td>'+
        '<td>'+
        '<span data-toggle="modal" data-index="'+i+'" data-target=".bs-example-modal-lg" class="glyphicon mock-edit glyphicon-edit"></span>'+
        '<span class="glyphicon glyphicon-trash delete-mock" data-index="'+i+'"></span>'+
        '</td>'+
        '</tr>')
    }).join('');
    $('.mock-box .table').html(html);

}
function saveMock(data) {
    $.ajax({url:'/set/mock',data:{data:JSON.stringify(data)}}).success(function (mes) {
        console.log(mes);
    })
}
function getMock() {
    $.get('/get/mock').success(function (mes) {
        showMock(mes);
        mockData=mes;
    });
}
getMock();
$.get('/get/host').success(function(mes){
    console.log(mes)
    setNowHost(mes);
    setActiveHost(mes);
});
$('.add-mock').on('click',function () {
    mockIndex=-1;
    oMockName.val('');
    oMockUrl.val('');
    oMockMessage.val('');
});

$('.save-mock').on('click',function () {
    var obj={
        name:oMockName.val(),
        url:oMockUrl.val(),
        message:oMockMessage.val()
    };
    if(mockIndex==-1){
        mockData.push(obj);
    }else{
        mockData[mockIndex]=obj;
    }
    showMock(mockData);
    saveMock(mockData);
    $('#mock-modal').modal('hide')
    console.log(mockData);
});
$(document).on('click','.mock-edit',function () {
    mockIndex=$(this).data('index');
    oMockName.val(mockData[mockIndex].name);
    oMockUrl.val(mockData[mockIndex].url);
    oMockMessage.val(mockData[mockIndex].message);
})
$(document).on('click','.changeHost',function(){
    var data=$(this).data('ip');
    changeHost(data);
});
$('.ip-form').submit(function(){
    setList()
    showHostList();
    var data=$('.ip-form').serialize();
    changeHost(data);
    return false;
});
$(document).on('click','.delete-mock',function () {
    var index=$(this).index;
    if(!confirm('是否删除这个api')) return false;
    mockData.splice(index,1);
    showMock(mockData);
    saveMock(mockData);
});
$(document).on('click','.delete-proxy',function(){
    var index=$(this).data('index');
    var list=getList();
    list.splice(list.length-index-1,1);
    var hostString=JSON.stringify(list);
    localStorage.setItem('hostList',hostString);
    setActiveHost({});
    showHostList();
});


showHostList();