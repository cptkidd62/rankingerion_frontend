package benchmarkerion;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * Test referee; agents print their scores
 */
public abstract class RefereeCaller {
  public static final int TIMEOUT = 10_000;

  private static class ErrorStreamThread extends Thread {
    final Process process;
    final StringBuilder log = new StringBuilder();
    ErrorStreamThread(Process process) {this.process = process;}
    @Override public void run() {
      try (BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()),1024*1024)) {
        String line;
        while ((line = errorReader.readLine()) != null) {
          log.append(line).append("\n");
        }
      } catch (Exception ignored) {
        //e.printStackTrace();
      }
    }
  }
  private static class OutStreamThread extends Thread {
    final Process process;
    final ArrayBlockingQueue<String> lines = new ArrayBlockingQueue<>(10);
    OutStreamThread(Process process) {this.process = process;}
    @Override public void run() {
      try (BufferedReader outReader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
        String line;
        while ((line = outReader.readLine()) != null) {
          lines.put(line);
        }
      } catch (Exception ignored) {
        //ignored.printStackTrace();
      }
    }
  }

  public static WorkerProcess.RefereePlayResult runOnePlay(String[] agents, long seed, String options) throws Exception {
    ErrorStreamThread[] errorThreads = new ErrorStreamThread[agents.length];
    OutStreamThread[] outThreads = new OutStreamThread[agents.length];

    String input = seed + "\n";
    for (int a = 0; a < agents.length; a++) {
      ProcessBuilder processBuilder = new ProcessBuilder(agents[a].split(" "));

      Process process = processBuilder.start();
      errorThreads[a] = new ErrorStreamThread(process);
      errorThreads[a].start();
      outThreads[a] = new OutStreamThread(process);
      outThreads[a].start();
      try (BufferedWriter outWriter = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()))) {
        outWriter.write(input);
        outWriter.flush();
      } catch (IOException ignored) {}
    }

    WorkerProcess.RefereePlayResult result = new WorkerProcess.RefereePlayResult();
    result.scores = new HashMap<>();
    result.errors = new HashMap<>();

    Thread.sleep(10);// Wait to not abuse system process spawning

    long startTime = System.currentTimeMillis();
    for (int a = 0; a < agents.length; a++) {
      long remainingTime = Math.max(0, System.currentTimeMillis() + TIMEOUT - startTime);
      String out = outThreads[a].lines.poll(remainingTime, TimeUnit.MILLISECONDS);
      int score = -1;
      if (out != null) try {
        score = Integer.parseInt(out);
      } catch (NumberFormatException ignored) {}
      outThreads[a].process.destroy();
      result.scores.put(a, score);
      ArrayList<String> logList = new ArrayList<>();
      logList.add(errorThreads[a].log.toString());
      result.errors.put(Integer.toString(a), logList);
      outThreads[a].interrupt();
      errorThreads[a].interrupt();
    }
    result.summaries = new ArrayList<>(0);

    return result;
  }

  public static void warmup() {}
}
