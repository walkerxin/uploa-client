### 小文件上传
##### 简要描述

- 小文件上传

##### 请求URL
- ` https://test.wukongyun.fun/v1/add `
  
##### 请求方式
- POST 

##### Head 参数

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|AuthToken |是  |string |token   |

##### Body 参数

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|form-data |是  |form-data |文件   |

##### 返回示例

```json
{
    "code": 200,
    "message": "sucess",
    "data": "fileid"
}
```

##### 返回参数说明

|参数名|类型|说明|
|:-----  |:-----|-----                           |
|code |int   | 200 成功 |
|message |string   | 消息内容 |
|data |string   | 文件id |



### 大文件上传（支持断点续传）
##### 简要描述

- 大文件上传（支持断点续传）

##### 请求URL
- ` https://test.wukongyun.fun/v1/addLargeFile `
  
##### 请求方式
- POST 

##### Head 参数

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|FileStartIndex |是  |string |文件切片当前的位置（单位字节，切片大小可选范围 1M-10M）   |
|FileSize |是  |string |文件大小 单位字节   |
|FileName |是  |string |文件名称   |
|FileMd5 |是  |string |文件MD5值   |
|AuthToken |是  |string |token   |
|NotificationLink |否  |string | 如果填写了异步通知链接，则上传最后一个切片完成后无需等待，异步通知返回的文件id和文件名称   |
##### Body 参数

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|  |是  |arraybuff |文件二进制流   |

##### 返回示例 （同步）

```
{
    "code":200,
    "message":"",
    "fileIndex":"",
    "id":""
}
```

##### 返回参数说明

|参数名|类型|说明|
|:-----  |:-----|-----                           |
|code |int   | 200 成功 |
|message |string   | 消息内容 |
|fileIndex |string   | 当前上传文件位置索引（单位字节） |
|id |string   | 文件ID(最后上传完成才会有) |


##### 返回示例 （异步）

```
{
    "code":200,
    "message":"",
    "fileIndex":"",
    "id":"",
    "fileName":""
}
```

##### 返回参数说明

|参数名|类型|说明|
|:-----  |:-----|-----                           |
|code |int   | 200 成功 |
|message |string   | 消息内容 |
|fileIndex |string   | 当前上传文件位置索引（单位字节） |
|id |string   | 文件ID(最后上传完成才会有) |
|fileName |string   | 文件名称 (最后上传完成才会有) |




### 文件下载（支持Range协议）
##### 简要描述

- 文件下载


##### 请求URL
- ` https://test.wukongyun.fun/v1/cat?id=QmbDSjb5MZiMxt2puGqwmPC7rNARpAVfcsRPZpBApWUXCd `
  
##### 请求方式
- GET 

##### Head 参数

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|AuthToken |是  |string |token   |


##### 返回文件

