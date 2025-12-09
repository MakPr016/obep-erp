"use client";

import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { analyzeText, type AnalysisResponse } from "@/lib/actions/analyze";

export function BloomsCheckButton() {
  const [open, setOpen] = useState(false);
  const [checkText, setCheckText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse>({
    blooms: null,
    dave: null,
    coppo: null,
  });

  const analyzeLevels = async () => {
    if (!checkText.trim()) {
      toast.error("Please enter a question or sentence to analyze");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults({ blooms: null, dave: null, coppo: null });

    try {
      const results = await analyzeText(checkText);
      setAnalysisResults(results);

      if (results.error) {
        toast.error(results.error);
      } else if (results.blooms?.error || results.dave?.error) {
        if (results.blooms?.level === "Sleeping") {
          toast.info("Waking up AI models... please wait 60s and try again.");
        } else {
          toast.warning("Analysis complete, but some models reported errors.");
        }
      } else {
        toast.success("Analysis complete");
      }
    } catch (error) {
      console.error("Analysis failed", error);
      toast.error("Failed to connect to analysis service");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "bg-gray-500";
    if (score >= 0.8) return "bg-green-600 hover:bg-green-700";
    if (score >= 0.5) return "bg-yellow-600 hover:bg-yellow-700";
    return "bg-red-600 hover:bg-red-700";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Brain className="mr-2 h-4 w-4" /> Check Level
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Check Taxonomy Levels</DialogTitle>
          <DialogDescription>
            Enter a question or sentence to analyze its Bloom&apos;s Taxonomy and
            Dave&apos;s Psychomotor levels.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="analysis-text">Question Text</Label>
            <Input
              id="analysis-text"
              placeholder="e.g., Construct a model to demonstrate..."
              value={checkText}
              onChange={(e) => setCheckText(e.target.value)}
              className="h-20"
            />
          </div>

          {(analysisResults.blooms || analysisResults.dave) && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2 rounded-lg border p-3 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Bloom&apos;s Level
                </div>
                {analysisResults.blooms?.error ? (
                  <span className="text-sm text-red-500 font-medium">
                    {analysisResults.blooms.error}
                  </span>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-lg">
                      {analysisResults.blooms?.level || "NA"}
                    </span>
                    {analysisResults.blooms?.confidence != null && (
                      <Badge
                        className={`${getConfidenceColor(
                          analysisResults.blooms?.confidence
                        )} w-fit`}
                      >
                        {(
                          (analysisResults.blooms?.confidence ?? 0) * 100
                        ).toFixed(1)}
                        % Confidence
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-lg border p-3 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Dave&apos;s Level
                </div>
                {analysisResults.dave?.error ? (
                  <span className="text-sm text-red-500 font-medium">
                    {analysisResults.dave.error}
                  </span>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-lg">
                      {analysisResults.dave?.level || "NA"}
                    </span>
                    {analysisResults.dave?.confidence != null && (
                      <Badge
                        className={`${getConfidenceColor(
                          analysisResults.dave?.confidence
                        )} w-fit`}
                      >
                        {((analysisResults.dave?.confidence ?? 0) * 100).toFixed(
                          1
                        )}
                        % Confidence
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={analyzeLevels} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
