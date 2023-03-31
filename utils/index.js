export default class SvgWaterMark {
  constructor(options) {
      this.watermark = {...options} // 水印属性
      this.mo = null // 节点监听器
  }

  _getDateStr() {
    // 生成YYYY-MM-DD日期字符串
    let date = new Date(),
    year = date.getFullYear(),
    month = date.getMonth() + 1,
    strDate = date.getDate()

    if (month >= 1 && month <= 9) month = '0' + month // 如果月份是个位数，在前面补0
    if (strDate >= 0 && strDate <= 9) strDate = '0' + strDate // 如果日是个位数，在前面补0
  
    return `${year}-${month}-${strDate}`
  }

  _render() {
    // 生成水印
    let {
        txt, // 必传参数
        width, // 不传时根据fontsize和txt长度推算
        height = 200, // 垂直间距
        color = '#000',
        font = "sans-serif",
        fontSize = 16,
        opacity = 0.05,
        angle = -20 // 倾斜角度
    } = this.watermark

    const date = this._getDateStr()

    // 窗口宽高
    const viewWidth = document.body.clientWidth
    const viewHeight = document.body.clientHeight

    const rad = Math.abs(angle) * Math.PI / 180 // 角度换算弧度

    // 水印画布宽高
    const bgWidth = viewWidth*Math.cos(rad) + viewHeight*Math.sin(rad)
    const bgHeight = viewHeight*Math.cos(rad) + viewWidth*Math.sin(rad)

    // 水印画布偏移量
    const offsetX = viewHeight*Math.sin(rad)
    
    if (!width) {
      const strWidth = txt.length*fontSize // 粗略文字推算宽度
      width = strWidth*2
    }

    // 创建水印模板
    const svgStr = 
    `<svg xmlns="http://www.w3.org/2000/svg" width="${viewWidth}px" height="${viewHeight}px" >
          <defs>
              <pattern id="grid" x="0" y="0" width="${width}px" height="${height}px" patternUnits="userSpaceOnUse">
                <text x="0px" y="10px" dy="${fontSize}px"
                    text-anchor="start"
                    stroke="${color}"
                    stroke-opacity="${opacity}"
                    fill="none"
                    font-weight="100"
                    font-size="${fontSize}"
                    font-family="${font}"
                    >
                    <tspan>${txt}</tspan>
                    <tspan x="0px" dy="${fontSize*1.5}px">${date}</tspan>
                </text>
                <text x="${width/2}px" y="${height/2}px" dy="${fontSize}px"
                    text-anchor="start"
                    stroke="${color}"
                    stroke-opacity="${opacity}"
                    fill="none"
                    font-weight="100"
                    font-size="${fontSize}"
                    font-family="${font}"
                    >
                    <tspan>${txt}</tspan>
                    <tspan x="${width/2}px" dy="${fontSize*1.5}px">${date}</tspan>
                </text>
              </pattern>
          </defs>
          <rect x="-${offsetX}px" y="0px" width="${bgWidth}px" height="${bgHeight}px" fill="url(#grid)" stroke="blue" transform="rotate(${angle})"></rect>
    </svg>`
    return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgStr)))}`
  }
    
  _createWm() {
      // 避免重复生成
      const __wm = document.querySelector('.wm_wrap')
      if (__wm) {
          return console.log('已经生成了')
      }

      // 生成水印节点
      let wm_div = document.createElement("div")
      wm_div.classList.add('wm_wrap')
      const styleStr = `
      width: 100%;
      height: 100%;
      position:fixed;
      x:0;
      y:0;
      z-index:10000;
      pointer-events:none;
      background-image: url(${this._render()});
      background-repeat: no-repeat;
      `

      wm_div.setAttribute('style', styleStr)
      document.body.insertBefore(wm_div, document.body.firstChild)

      // 监听器
      const MutationObserver = window.MutationObserver || window.WebKitMutationObserver
      if (MutationObserver) {
          // 生成监听器
          this.mo = new MutationObserver(() => {
              const __wm = document.querySelector('.wm_wrap')
              // 水印元素不存在或者水印样式被修改时触发
              if ((__wm && __wm.getAttribute('style') !== styleStr) || !__wm) {
                  console.log('mutationObserver catch change!')
                  // 删除原有元素
                  if (__wm) {
                    __wm.remove(0)
                  }
                  // 销毁监听器，避免一直触发
                  this.mo.disconnect()
                  this.mo = null
                  // 重新生成水印
                  this._createWm()
              }
          })

          // 执行监听器
          this.mo.observe(document.body, {
              attributes: true,
              subtree: true, 
              childList: true
          })
      }
    }

  _removeWm() {
      // console.log('remove__WM')
      const __wm = document.querySelector('.wm_wrap')
      if (__wm) {
          __wm.remove(0)
          // 销毁监听器
          this.mo&&this.mo.disconnect()
          this.mo = null
      }
  }

  // 单例创建
  static create(options) {
    if (this.instance) {
      return console.log('Watermark has already been created')
    }
    this.instance = new SvgWaterMark(options)
    this.instance._createWm()
  }

  // 销毁
  static destroy() {
    if (!this.instance) {
      return console.log('Watermark has not been created')
    }
    this.instance._removeWm()
    this.instance = null
  }

  // 刷新
  static refresh() {
    if (!this.instance) {
      return
    }
    const options = {...this.instance.watermark}
    this.destroy()
    this.create(options)
  }
}