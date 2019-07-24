
define(function(require) {

  function getVZ(VX, VY) {

    if(VX === 'x')
      if(VY === 'y') return 'z'
      else return 'y'

    if(VX === 'y')
      if(VY === 'x') return 'z'
      else return 'x'

    if(VX === 'z')
      if(VY === 'x') return 'y'
      else return 'x'

    return false

  }

  /**
   * наличие пересечения линий в плоскости XZ
   */
  function isCrossLines2(v1, v2, v3, v4, VX = 'x', VY = 'y') {
    
    var v13 = v1.clone().sub(v3)
    var v21 = v2.clone().sub(v1)
    var v23 = v2.clone().sub(v3)
    var v31 = v3.clone().sub(v1)
    var v41 = v4.clone().sub(v1)
    var v43 = v4.clone().sub(v3)
    
    var ccw = (v1, v2) => v1[VX] * v2[VY] - v1[VY] * v2[VX]

    return ( (ccw(v21, v31) < 0) ^ (ccw(v21, v41) < 0) ) &&
            ( (ccw(v43, v23) < 0) ^ (ccw(v43, v13) < 0) )

  }

  /**
   * расчитывает точку пересечения 2ух прямых (не отрезков)
   */
  function linesCrossPoint2(v1, v2, v3, v4, VX = 'x', VY = 'y') {

    var K1 = (v2[VY] - v1[VY])/(v2[VX] - v1[VX])
    var K2 = (v4[VY] - v3[VY])/(v4[VX] - v3[VX])

    var B1 = (v2[VX]*v1[VY] - v1[VX]*v2[VY])/(v2[VX] - v1[VX])
    var B2 = (v4[VX]*v3[VY] - v3[VX]*v4[VY])/(v4[VX] - v3[VX])

    var x, y
    if(v1[VX] === v2[VX] && v3[VX] === v4[VX]) {

      x = v1[VX]
      y = v1[VY]

    } else if(v1[VX].toFixed(10) === v2[VX].toFixed(10)) {

      x = v1[VX]
      y = K2*x+B2

    } else if(v3[VX].toFixed(10) === v4[VX].toFixed(10)) {

      x = v3[VX]
      y = K1*x+B1

    } else {

      x = (B2 - B1)/(K1 - K2)
      y = K1*x+B1

    }

    var res = new THREE.Vector3

    res[VX] = x
    res[VY] = y

    return res

  }

  /**
   * точка пересечения линий в плоскости XZ
   */
  function lineCross2(line1, line2, VX = 'x', VY = 'y') {

    var v1 = line1.start
    var v2 = line1.end
    var v3 = line2.start
    var v4 = line2.end

    if(!isCrossLines2(v1, v2, v3, v4, VX, VY)) return false

    return linesCrossPoint2(v1, v2, v3, v4, VX, VY)

  }

  function pointInTriangle2(p, p1, p2, p3, VX = 'x', VY = 'y') {

    var a = ( p1[VX] - p[VX] ) * ( p2[VY] - p1[VY] ) - ( p2[VX] - p1[VX] ) * ( p1[VY] - p[VY] )
    var b = ( p2[VX] - p[VX] ) * ( p3[VY] - p2[VY] ) - ( p3[VX] - p2[VX] ) * ( p2[VY] - p[VY] )
    var c = ( p3[VX] - p[VX] ) * ( p1[VY] - p3[VY] ) - ( p1[VX] - p3[VX] ) * ( p3[VY] - p[VY] )

    a = Math.round(a*10)
    b = Math.round(b*10)
    c = Math.round(c*10)

    a /= Math.abs(a)
    b /= Math.abs(b)
    c /= Math.abs(c)

    return Math.abs(a + b + c) === 3

  }

  function isBetweenPoints(p, p1, p2, v, VX = 'x', VY = 'y') {
    
    var rot = new THREE.Euler
    rot[getVZ(VX, VY)] = Math.PI/2

    var rv = v.clone().applyEuler(rot).toFixed().multiplyScalar(10)

    var v1 = p
    var v2 = v.clone().multiplyScalar(10).add(p)
    var v3 = p1
    var v4 = p1.clone().add(rv)

    var pp1 = linesCrossPoint2(v1, v2, v3, v4, VX, VY)
    var vec1 = pp1.clone().sub(v1).normalize()

    v3 = p2
    v4 = p2.clone().add(rv)

    var pp2 = linesCrossPoint2(v1, v2, v3, v4, VX, VY)
    var vec2 = pp2.clone().sub(v1).normalize()

    // при точном расчете было бы 0 если за пределами и Math.PI - в пределах.
    // но так как это JS и тут триллион округлений, условия менее конкретное
    return vec1.angleTo(vec2) > 1

  }

  /**
   * пересчет размеров с учетом поворота
   * 
   * @param SIZE { Vector3 }
   * @param ROTATION { Number }
   * 
   * @returns SIZE { Vector3 }
   * 
   */
  function calcRealSize(SIZE, ROTATION, VX = 'x', VY = 'y') {

    var x = SIZE[VX]*Math.cos(ROTATION)+SIZE[VY]*Math.sin(ROTATION)
    var y = SIZE[VX]*Math.sin(ROTATION)+SIZE[VY]*Math.cos(ROTATION)

    SIZE[VX] = x
    SIZE[VY] = y

    return SIZE

  }

  return {

    isCrossLines2,
    linesCrossPoint2,
    lineCross2,
    pointInTriangle2,
    isBetweenPoints,
    calcRealSize

  }

})
