'use babel';
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var SerialPort = require('serialport');

export default class upySerial {
  constructor() {
    this.serial = null;
    this.upyReadFileCmd = 'f.read()';
    this.upyCloseFileCmd = 'f.close()';
    this.upyImportOsCmd = 'import os';
    this.upyListDirCmd = 'os.listdir()';

    this.SerialConst = {
      'OPEN_TIMEOUT': 1,
      'CHAR_TIMEOUT': 0.1,
      'READ_TIMEOUT': 0.8,
      'CODE_CTRL_C': 0x03
    };
    this.serial_timeout = null;
  }

  _isValidPort(portName) {
    if (navigator.appVersion.indexOf('Win') != -1 ) {
      if (portName && (portName.indexOf('COM') > -1)) {
        return true;
      }
    }

    if (navigator.appVersion.indexOf('Mac') != -1) {

    }

    if (navigator.appVersion.indexOf('Linux') != -1) {
      if (portName && ((portName.indexOf('ttyACM') > -1 || portName.indexOf('ttyUSB') > -1) &&
        portName.indexOf('/dev') > -1)) {
        return true;
      }
    }

    return false;
  }

  list() {
    _this = this;
    var portList = [];

    return new Promise(function(resolve, reject) {
      SerialPort.list(function(err, ports) {
        ports.forEach(function(port) {
          if (_this._isValidPort(port.comName)) {
            portList.push(port.comName);
          }
        });
        resolve(portList);
      });
    });
  }

  connect(portName) {
    var timeout = null;

    return new Promise(function(resolve, reject) {
      this.serial = new SerialPort(portName,{
        baudrate: 115200,
        autoOpen: false
      });

      // open errors will be emitted as an error event
      this.serial.on('error', function(err) {
        reject('Open port error: ' + Error(err));
      });

      this.serial.open(function() {
        this.send('\r\n',function() {
            clearTimeout(timeout);
            resolve();
        })
        timeout = setTimeout(function() {
          this.disconnect();
          reject('Serial connect timeout');
        },this.SerialConst['OPEN_TIMEOUT']*1000)
      })
    });
  }

  disconnect() {
    this.serial.close();
  }

  _parseOutput(data, cmd) {
    // Find the line that contains the command
    var upyRegexParse = /((.*\r\n)+)>>>/g;
    var match = upyRegexParse.exec(data);

    // If the command is not echoed, something error
    if (match == null) {
      return null;
    }

    // Remove command from receive buffer
    // capturing group n: match[n]
    return match[1].replace(cmd, '');
  }

  _backSlashCount(textData, index) {
    if (index == 0) {
      return 0;
    }

    var examine = index-1;
    var count = 0;

    while (examine >= 0) {
      // if no more backslash
      if (textData[examine] != '\\')
        return count;

      // check if still more backslash
      count += 1;
      examine -= 1;
    }

    return count;
  }

  _appendEscapeChar(textData, escapedChar) {
    var match = textData.indexOf(escapedChar);
    if (match == -1) {
      return textData;
    }

    while (match != -1) {
      backslash_count = this._backSlashCount(textData, match);

      // if the baskslash is even, add one more backslash to escaped wanted character
      if (backslash_count % 2 == 0) {
        textData = textData.slice(0, match) + '\\' + textData.slice(match, textData.length-1)
        match = textData.indexOf(escapedChar, match+2)
      } else { // if it is odd no need to add any backslash
        match = textData.indexOf(escapedChar, match+1)
      }
    }

    return textData;
  }


  upyListFile() {
    return new Promise(function(resolve, reject) {
      this.upySendCmd(this.upyImportOsCmd, true)
        .then((data) => {
          // Not interested in import command's output

          this.upySendCmd(upyListDirCmd, true)
            .then((data) => {
              var body = data.replace(/\r\n/g, '');
              if (data.length == 0) {
                resolve([]);
              }

              // replace the character ' with ", so js can parse with JSON
              // ex, [ 'file1.py', 'file2.py' ] => fail
              //     [ "file1.py", "file2.py" ] => good
              body = body.replace(/\'/g, '"');
              resolve(JSON.parse(body));
            })
        })
    });
  }

  upyReadFile(fileName) {
    var upyOpenFileCmd = `f=open(\'${ fileName }\', \'r\')`;
    var result = '';

    return new Promise(function(resolve, reject) {
      this.upyListFile()
        .then((listFiles) => {
          if (listFiles.indexOf(fileName) == -1) {
            reject('File "' + fileName + '"' + ' not found !!!');
          }

          return this.upySendCmd(upyOpenFileCmd);
        })
        .then((data) => {
          return this.upySendCmd(upyReadFileCmd, true);
        })
        .then((data) => {
          // content of file is here
          result = data
          return this.upySendCmd(upyCloseFileCmd);
        })
        .then((data) => {
          resolve(result);
        })
    });
  }

  upyWriteFile(fileName, fileData) {
    var upyOpenForWriteFileCmd = `f=open(\'${ fileName }\', \'w\')`;
    var lines_splitted = null;
    var idx = 0;

    var promiseWhile = function(condition, action) {
      var resolver = Promise.defer();

      var loop = function() {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
          .then(loop)
          .catch(resolver.reject);
      };

      process.nextTick(loop);

      return resolver.promise;
    };

    return new Promise(function(resolve, reject) {
      this.upySendCmd(upyOpenForWriteFileCmd)
        .then((data) => {
          fileData = fileData.replace(/\r/g, '');
          lines_splitted = fileData.split('\n');

          promiseWhile(function() {
            // Condition for stopping
            return (idx < (lines_splitted.length - 1));
          }, function() {
            // The function to run, should return a promise
            return new Promise(function(resolve, reject) {
              var line_write = this._appendEscapeChar(lines_splitted[idx], '\'');
              var write_cmd = `f.write('${ line_write }\\n')`;
              this.upySendCmd(write_cmd)
                .then((data) => {
                  idx++;
                  resolve();
                })
            });
          })
          .then(() => {
            // send done, close the file
            return this.upySendCmd(upyCloseFileCmd);
          })
          .then((data) => {
            resolve(true);
          });
        })
    });
  }

  upyRemoveFile(fileName) {
    var upyRemoveFileCmd = `os.remove(\'${ fileName }\')`;
    return new Promise(function(resolve, reject) {
      this.upyListFile()
        .then((listFiles) => {
          if (listFiles.indexOf(fileName) == -1) {
            reject('File "' + fileName + '"' + ' not found !!!');
          }

          return this.upySendCmd(upyRemoveFileCmd);
        })
        .then((data) => {
          resolve(true)
        })
    });
  }

  upyReceiveRsp(getOutput=false) {
    var time_out = 0;

    if (getOutput == true) {
      time_out = SerialConst['READ_TIMEOUT']*1000;
    } else {
      time_out = SerialConst['CHAR_TIMEOUT']*1000;
    }

    return new Promise(function(resolve, reject) {
      // initialize the receiving state machine
      var rcv_buff = '';

      this.serial_timeout = setTimeout(function() {
        resolve(rcv_buff)
      }, time_out)

      this.serial.on('data', function(data) {
        rcv_buff += data;

        clearTimeout(this.serial_timeout);

        this.serial_timeout = setTimeout(function() {
          resolve(rcv_buff)
        }, time_out)
      });
    });
  }

  upySendCmd(cmd, getOutput=false, ctrlCSignal=false) {
    return new Promise(function(resolve, reject) {
      // if (ctrlCSignal == true) {
      //   this.serial.write(SerialConst['CODE_CTRL_C'], function() {
      //     this.serial.drain();
      //   });
      //   // Wait until target is able to receive new command
      //   if (getOutput == true) {
      //     this.upyReceiveRsp()
      //       .then((data) => {
      //       })
      //   }
      // }

      // Append new line at the end of command
      cmd += '\r\n'
      this.serial.write(cmd, function() {
        this.serial.drain();
      });

      this.upyReceiveRsp(getOutput)
        .then((data) => {
          resolve(this._parseOutput(data, cmd))
        });
    });
  }
}
