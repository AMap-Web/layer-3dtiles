interface ListenerItem{
  callback: Callback
  isOnce?: boolean
}
interface Listeners {
  [key: string]: ListenerItem[]
}
type Callback = <T>(e: T) => void
abstract class BaseEvent {
  private _listeners: Listeners = {}

  /**
   * 绑定事件
   * @param name 事件名称
   * @param cb  事件回调
   * @param isOnce 是否只执行一次
   */
  on(name:string, cb: Callback, isOnce?: boolean):void{
    if(this._listeners[name]){
      this._listeners[name].push({
        callback: cb,
        isOnce
      })
    }else{
      this._listeners[name] = [{
        callback: cb,
        isOnce
      }]
    }
  }
  off(name:string, cb: Callback){
    if(!cb){
      throw new Error('取消事件时需要传入原回调函数')
    }
    const listeners = this._listeners[name]
    if(listeners && listeners.length > 0){
      for(let i=0;i<listeners.length;i++){
        const current = listeners[i]
        if(current.callback === cb){
          listeners.splice(i, 1)
          break
        }
      }
    }
  }
  emit(name:string, data?: any){
    const listeners = this._listeners[name]
    if(listeners && listeners.length > 0){
      for(let i=0;i<listeners.length;i++){
        const current = listeners[i]
        current.callback.call(this, data)
        if(current.isOnce){
          listeners.splice(i, 1)
          i--
        }
      }
    }
  }
}

export default BaseEvent
