import Stream, { Writable, PassThrough } from "stream";
import util from "util";

const pipeline = util.promisify(Stream.pipeline);
const nextTick = util.promisify(process.nextTick);

// This Transform cheaply checks that a gzipped stream looks like a json.
class MyStream extends Writable {
  _write(chunk, encoding, callback) {
    console.log("_write", chunk);
    callback();
    // Calling end will also stop any piping gracefully.
    // Using nextTick allows some bufferred write to finish.
    process.nextTick(() => this.end());
  }

  // This is called when all the data has been given to _write and the
  // stream is ended.
  _final(callback) {
    console.log("_final()");
    callback();
  }
}

async function run() {
  console.log("START TEST");
  const fixture = "WRITE SOMETHING";
  const checker = new MyStream();
  const input = new PassThrough();
  const pipelinePromise = pipeline(input, checker);
  console.log("WRITE 1");
  input.write(fixture.slice(0, 3));
  await nextTick();
  console.log("WRITE 2");
  input.end(fixture.slice(3));
  console.log("WAIT FOR PIPELINE END");
  await pipelinePromise;
  console.log("FINISHED");
}

// Keeps the node process running
const intervalId = setInterval(() => {}, 1000);

console.log("Starting");
run()
  .then(() => console.log("End!"))
  .catch((e) => console.error(e))
  .then(() => clearInterval(intervalId));
