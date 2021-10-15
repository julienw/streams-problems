# streams-problems
This reproduces an issue in node v14 and v16 with streams

You can use `nvm` to run the script with various versions of node:
```
### node v12
nvm run v12 node-streams

### node v14
nvm run v14 node-streams

### node v16
nvm run v16 node-streams
```

With node v12, we get this output:
```
Running node v12.22.4 (npm v6.14.14)
Starting
START TEST
WRITE 1
_write <Buffer 57 52 49>
_final()
WRITE 2
WAIT FOR PIPELINE END
FINISHED
End!
```

With node v14 or v16, we get:
```
Running node v14.17.5 (npm v6.14.14)
Starting
START TEST
WRITE 1
_write <Buffer 57 52 49>
_final()
WRITE 2
WAIT FOR PIPELINE END
```

I think we should get one of these results:
1. like v12, the pipeline is unpiped and therefore it should end because Passthrough will just finish consuming the data. (I think)
2. otherwise, we should get an error because we're trying to write after `end` (`[ERR_STREAM_WRITE_AFTER_END]: write after end`).

Here it looks like that the pipeline isn't unpiped AND we don't get an error. So the written data isn't consumed by the stream that's been ended, and we're waiting forever.

### Additional note
Replacing `process.nextTick(() => this.end());` with something like `await nextTick(); this.end();` gets an error (behavior 2 above), which is different than node v12 but at least we're not waiting forever and we get some clue.
