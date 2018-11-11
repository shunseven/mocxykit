# express-proxy-mock

# 使用背景
  在前端开发中有一项很重要的工作是后台同事进行数据联调，联调你就要通过对应不同的同事ip进行通讯，这个时候你会遇到浏览器的同源策略引起的跨域问题，还有你可能想有没有快速切换不同的ip进行联调，不用每次修改配制重起不同的服务，在后台接口还没开发完时，能在本地快速的创建假如据，而且接口与后台完全一制而不用在真正联调时还需要修改url，造成没必要的bug，以上这些问题就是我想开发这个express插件的初衷！


# 五行代码启动带 props,mock功能的 node 服务！
```
 npm install express
 npm install express-proxy-mock
```
  先在项目中运行以上两行命令；
  然后在你的项目建个‘server.js’的文件；
```
  var http=require('http');
  var proxyMock＝require('express-proxy-mock');
  var app=require('express')();
  proxyMock(app)
  http.createServer(app).listen(3000,'localhost');
```
最后运行 node server.js  在浏览器打开localhost:3000/config 就能看到props和mock功能界面！
![image](https://raw.githubusercontent.com/shunseven/express-proxy-mock/master/images/info.png)

# 命中规则
  同一个url 在多个功能上都有配制！命中先后顺序为 （代码块-> mock数据 -> 部分代理 -> 全局代理）

# 全局代理
  功能： 代理是用来解决浏器同源策略引起的跨域问题 和 开发联调时直接指定机器进行联调，如后端同事的ip,开发环境的IP，测试环境的IP。
![image](https://raw.githubusercontent.com/shunseven/express-proxy-mock/master/images/info1.png)

# 部分代理
  功能：某个URL不想走全局代理，可以独设置代理的请求。

  参数：

  url: 你要代理的url （注：/test/*, test/**/dd 可以通过这种方式设定开头匹配，或中间匹配）

  代理地址： 你要代理到的完整地址，(注： 一定要填写完整的地址如--http://localhost:3000， 代理地址可带path)

  是否代理Path： 如是，装url拼到代理上，如否的话，将忽略url,以代理地址为准。

# mock功能
  在后台api还没开发完成前，我们经常要一些假数据进行调试，这就是mock的用途，这个插件构建的mock可以让快速可视化的编辑创建，并让api的url保持与线上完全一致！
![image](https://raw.githubusercontent.com/shunseven/express-proxy-mock/master/images/info2.png)
![image](https://raw.githubusercontent.com/shunseven/express-proxy-mock/master/images/info3.png)

# 部分mock功能
  很多时候我们与别人联调时，可能只是其中某个接口要联调，其它的接口可能会有不通的情况，这个时候部分mock是很好用的功能，我们只需代理转发要联调的接口其它用假数据，这也是其它mock工具比较难实现的功能之一
  ![image](https://raw.githubusercontent.com/shunseven/express-proxy-mock/master/images/info4.png)


# 代码段
  功能： 能功代码段提代的epm的sdk, 可以对mock数据进行增删改查的操作，以最简单快速的方式，对一些业务逻辑模拟

  以部分代码段
  ```
    epm.requestData.body // post 请求中的参数
    epm.requestData.query // url 上带的参数
    const mockData = epm.getMockData({ // 获取mock数据
       url: '/test'
    })
    epm.setMockData({  // 设置mock数据
        url: '/test2',
        name: '测试数据二'
        data: {  // 同时设置多个不同，可以是数组
          requestData: {}, // 请求参数
          responseData: {}  // 返还数据
        }

    }，
     false // true将不管之前有没有数据，真接覆盖原来的数据，false 将根据请求参数（requestData）合并，

     如请求参数一致，将覆盖否则增加一条，默认false
    )
    epm.deleteMockData({
        url: '/test', // 要删除的URL
        requestData: { // 没有requestData将会把'/test'整条删除，有requestData将删除与requestData一致请求参数项
        }
    })
    epm.send({}) 设置这次请求的返加数据
    epm.next() 跳过代码块，继续往下命中, 如mock数据设置了相同的url，就会返回mock数据
  ```
    emp.send与emp.next在代码快中必须存在一个



# 与webpack的结合
我们给redux官方的[todo](https://github.com/reactjs/redux/tree/master/examples/todos)的例子加上这个功能,
我们只需要在它的[server.js](https://github.com/reactjs/redux/blob/master/examples/todos/server.js)文件加上两行代码就可以了
```
var compiler = webpack(config)
//以下两行为添加的代码
var proxyMock＝require('express-proxy-mock');
proxyMock(app)
//end
app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }))
app.use(webpackHotMiddleware(compiler))
```
最后运行localhost:3000/config你就能看到proxy,与mock 操作界面！

# 与vue-cli的结合(vue-cli 2.9.0 之前的版本)
在通过vue-cli构建出来的项目,我们只需要在build/dev-server.js上修改两行代码就能实现这个功能，如图添加前面两行代码，注释掉后面那行代码

![image](https://raw.githubusercontent.com/shunseven/express-proxy-mock/master/images/info5.png)


最后运行npm run dev , 打开localhost:8080/config(8080为你项目配的port)你就能看到proxy,与mock 操作界面！

# webpack-dev-server的结合(vue-cli 2.9.0 之后的版本,开始使用webpack-dev-server)
在 webpack-dev-server的配制参数增加after的回调处理，代码如下（vue-cli 在webpack.dev.conf中devServer下添加after）

![image](https://raw.githubusercontent.com/shunseven/express-proxy-mock/master/images/info6.png)

最后运行npm run dev , 打开localhost:8080/setting(8080为你项目配的port)你就能看到proxy,与mock 操作界面！(由于config会与文件目录冲突，故这里配制成setting)

