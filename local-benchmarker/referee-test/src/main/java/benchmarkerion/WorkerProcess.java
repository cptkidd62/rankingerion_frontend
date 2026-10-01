package benchmarkerion;

import java.io.*;
import java.util.List;
import java.util.Map;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.Logger;

public abstract class WorkerProcess {

  public static class RefereePlayResult {
    java.util.Map<Integer,Integer> scores;
    Map<String, List<String>> errors;
    List<String> summaries;
  }

  static final char SPLIT_CHAR = (char)30;

  public static String exceptionToString(Exception e) {
    StringWriter sw = new StringWriter();
    e.printStackTrace(new PrintWriter(sw));
    return sw.toString();
  }
  public static String concatenateListOfStrings(List<String> list) {
    StringBuilder s = new StringBuilder();
    for (String el: list) if (el != null) s.append(el);
    return s.toString();
  }
  public static String encodeToOneLine(String s) {
    return (s == null ? "" : s.replace('\n', (char)31));
  }
  public static String decodeFromOneLine(String s) {
    return s.replace((char)31, '\n');
  }

  private static String runOnePlay(long seed, String[] agents, int[] optLogs, String refereeArgStr) throws Exception {
    long startTime = System.currentTimeMillis();
    RefereePlayResult result = RefereeCaller.runOnePlay(agents, seed, refereeArgStr);
    long endTime = System.currentTimeMillis();

    // P = agents.length; split by Config.SPLIT_CHAR
    // time score1 score2 ... scoreP log1 log2 ... logP logReferee
    StringBuilder s = new StringBuilder();
    s.append(endTime - startTime).append(SPLIT_CHAR);
    boolean[] crashed = new boolean[agents.length];
    for (int p = 0; p < agents.length; p++) {
      int score;
      try {
        score = result.scores.get(p);
      } catch (Exception e) {
        throw new Exception("Nie ma " + p + " w score: " + result.scores.get(0));
      }
      crashed[p] = (score < 0);
      s.append(score).append(SPLIT_CHAR);
    }
    boolean anyCrashed = false;
    for (int p = 0; p < agents.length; p++) {
      anyCrashed = anyCrashed || crashed[p];
      if (optLogs[p] == 2 || (optLogs[p] == 1 && crashed[p])) s.append(concatenateListOfStrings(result.errors.get(Integer.toString(p))));
      s.append(SPLIT_CHAR);
    }
    if (optLogs[agents.length] == 2 || (optLogs[agents.length] == 1 && anyCrashed)) s.append(concatenateListOfStrings(result.summaries));
    return s.toString();
  }

  // ******************************************************************************************************************

  /**
   * In a separate process
   */
  public static void main(String[] params) {
    if (params.length != 1 || !params[0].equals("w")) {
      throw new IllegalArgumentException("This is worker's main, not for manual run");
    }
    try {
      Logger rootLogger = LogManager.getLogManager().getLogger("");
      rootLogger.setLevel(Level.OFF);
      for (Handler h : rootLogger.getHandlers()) rootLogger.removeHandler(h);
      RefereeCaller.warmup();
      BufferedReader input = new BufferedReader(new InputStreamReader(System.in));
      System.gc();
      String line;
      while ((line = input.readLine()) != null) {
        if (line.equals("q")) {
          //System.exit(0);
          return;
        }
        String[] args = line.split("\\|", -1);
        int index = 0;
        int numAgents = Integer.parseInt(args[index++]);
        long seed = Long.parseLong(args[index++]);
        String[] agentCmds = new String[numAgents];
        int[] optLogs = new int[numAgents+1];
        for (int p = 0; p < agentCmds.length; p++) {
          agentCmds[p] = args[index++];
          optLogs[p] = Integer.parseInt(args[index++]);
        }
        optLogs[agentCmds.length] = Integer.parseInt(args[index++]);
        String refereeOptions = args[index];
        try {
          String resultStr = runOnePlay(seed, agentCmds, optLogs, refereeOptions);
          System.out.println(encodeToOneLine(resultStr));
        } catch (Exception e) {
          System.out.println("runOnePlay exception for: " + line + encodeToOneLine("\n" + exceptionToString(e)));
        }
        System.out.flush();
      }
    } catch (Exception e) {
      System.out.println("WorkerProcess exception:" + encodeToOneLine("\n" + exceptionToString(e)));
      System.out.flush();
    }
  }
}
