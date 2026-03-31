/* import dgram from 'node:dgram'   //UDP
import net from 'node:net'  // TCP
import http from 'node:http'
import https from 'node:https'
import dns from 'node:dns' */

import os from 'node:os'

const networkInterfaces = os.networkInterfaces()
console.log(networkInterfaces)