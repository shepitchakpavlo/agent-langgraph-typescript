#!/usr/bin/env python3
"""
RAGAS Evaluation Script
Accepts JSON input via stdin or file path and outputs evaluation results as JSON.
"""

import os
import sys
import json
import math
import argparse
from typing import Dict, Any, List, Optional

from ragas import EvaluationDataset, evaluate
from ragas.metrics._faithfulness import Faithfulness
from ragas.metrics._answer_relevance import AnswerRelevancy
from ragas.metrics._context_precision import ContextPrecision
from ragas.metrics._context_recall import ContextRecall
from ragas.llms import llm_factory
from ragas.embeddings import LangchainEmbeddingsWrapper
from openai import AsyncOpenAI
from langchain_openai import OpenAIEmbeddings as LangChainOpenAIEmbeddings


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="RAGAS Evaluation Script")
    parser.add_argument(
        "--input-file",
        type=str,
        help="Path to JSON file containing evaluation data"
    )
    parser.add_argument(
        "--output-file",
        type=str,
        help="Path to save evaluation results (optional, prints to stdout if not provided)"
    )
    return parser.parse_args()


def read_input(input_file: Optional[str]) -> Dict[str, Any]:
    """Read input data from file or stdin."""
    if input_file:
        with open(input_file, 'r') as f:
            return json.load(f)
    return json.loads(sys.stdin.read())


def get_config(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract configuration from input data with environment variable fallbacks."""
    api_key = (
        input_data.get("api_key")
        or os.environ.get("OPENROUTER_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
    )
    base_url = input_data.get("baseURL") or os.environ.get("OPENROUTER_API_BASE")

    if not api_key:
        raise ValueError(
            "API key must be provided via input or OPENROUTER_API_KEY/OPENAI_API_KEY environment variable"
        )

    return {
        "api_key": api_key,
        "base_url": base_url,
        "model": input_data.get("model", "deepseek/deepseek-chat-v3-0324"),
        "metrics": input_data.get("metrics", ["faithfulness", "answer_relevancy"]),
    }


def create_llm(config: Dict[str, Any]) -> Any:
    """Create and configure the LLM."""
    llm_client = AsyncOpenAI(
        api_key=config["api_key"],
        base_url=config["base_url"] if config["base_url"] else None
    )
    return llm_factory(config["model"], provider="openai", client=llm_client)


def create_embeddings(config: Dict[str, Any]) -> Any:
    """Create and configure the embeddings model."""
    embeddings_model = (
        "openai/text-embedding-3-small"
        if config["base_url"]
        else "text-embedding-3-small"
    )
    langchain_embeddings = LangChainOpenAIEmbeddings(
        model=embeddings_model,
        openai_api_key=config["api_key"],
        openai_api_base=config["base_url"],
    )
    return LangchainEmbeddingsWrapper(embeddings=langchain_embeddings)


def create_metrics(llm: Any, embeddings: Any, metric_names: List[str]) -> List[Any]:
    """Instantiate the requested RAGAS metrics."""
    faithfulness_metric = Faithfulness(llm=llm)
    answer_relevancy_metric = AnswerRelevancy(llm=llm, embeddings=embeddings)
    context_precision_metric = ContextPrecision(llm=llm)
    context_recall_metric = ContextRecall(llm=llm)

    # Set embeddings on context metrics
    if hasattr(context_precision_metric, 'embeddings'):
        context_precision_metric.embeddings = embeddings
    if hasattr(context_recall_metric, 'embeddings'):
        context_recall_metric.embeddings = embeddings

    metric_map = {
        "faithfulness": faithfulness_metric,
        "answer_relevancy": answer_relevancy_metric,
        "context_precision": context_precision_metric,
        "context_recall": context_recall_metric,
    }

    metrics = []
    for metric_name in metric_names:
        if metric_name not in metric_map:
            raise ValueError(f"Unknown metric: {metric_name}")
        metrics.append(metric_map[metric_name])

    return metrics


def prepare_dataset(input_data: Dict[str, Any]) -> EvaluationDataset:
    """Convert input samples to RAGAS EvaluationDataset."""
    samples = input_data.get("samples", [])
    if not samples and "sample" in input_data:
        samples = [input_data["sample"]]

    if not samples:
        raise ValueError("No samples found in input data")

    eval_data = []
    for sample in samples:
        eval_item = {
            "user_input": sample.get("question", sample.get("user_input", "")),
            "retrieved_contexts": sample.get("context", sample.get("retrieved_contexts", [])),
            "response": sample.get("answer", sample.get("response", "")),
        }

        if "reference" in sample or "ground_truth" in sample:
            eval_item["reference"] = sample.get("reference", sample.get("ground_truth", ""))

        eval_data.append(eval_item)

    return EvaluationDataset.from_list(eval_data)


def safe_float(val: Any) -> Optional[float]:
    """Convert value to float, returning None for NaN."""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    return float(val)


def process_results(results: Any, metric_names: List[str]) -> Dict[str, Any]:
    """Convert RAGAS results to JSON-serializable dictionary."""
    results_dict = {
        "metrics": {},
        "per_sample": []
    }

    if not hasattr(results, 'to_pandas'):
        # Fallback for legacy format
        for key, value in results.items():
            results_dict["metrics"][key] = float(value)
        return results_dict

    df = results.to_pandas()

    # Calculate aggregate statistics
    for metric_name in metric_names:
        if metric_name in df.columns:
            col = df[metric_name]
            results_dict["metrics"][metric_name] = {
                "mean": safe_float(col.mean()),
                "std": safe_float(col.std()),
                "min": safe_float(col.min()),
                "max": safe_float(col.max()),
            }

    # Extract per-sample scores
    for idx, row in df.iterrows():
        sample_results = {}
        for metric_name in metric_names:
            if metric_name in df.columns:
                sample_results[metric_name] = safe_float(row[metric_name])

        results_dict["per_sample"].append({
            "index": idx,
            "scores": sample_results
        })

    return results_dict


def write_output(results_dict: Dict[str, Any], output_file: Optional[str]) -> None:
    """Write results to file or stdout."""
    output_json = json.dumps(results_dict, indent=2)

    if output_file:
        with open(output_file, 'w') as f:
            f.write(output_json)
        print(f"Results saved to {output_file}", file=sys.stderr)
    else:
        print(output_json)


def main():
    """Main entry point for the RAGAS evaluation script."""
    args = parse_args()

    input_data = read_input(args.input_file)

    if not isinstance(input_data, dict):
        raise ValueError("Input must be a JSON object")

    config = get_config(input_data)

    llm = create_llm(config)
    embeddings = create_embeddings(config)
    metrics = create_metrics(llm, embeddings, config["metrics"])
    dataset = prepare_dataset(input_data)

    print(f"Running evaluation with {len(metrics)} metric(s) on {len(dataset)} sample(s)...", file=sys.stderr)
    results = evaluate(dataset=dataset, metrics=metrics)

    results_dict = process_results(results, config["metrics"])
    write_output(results_dict, args.output_file)


if __name__ == "__main__":
    main()
