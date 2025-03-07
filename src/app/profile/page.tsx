"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Query {
  id: string;
  text: string;
  response: string;
  createdAt: string;
}

export default function Profile() {
  const { data: session, status } = useSession();
  const [queries, setQueries] = useState<Query[]>([]);
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchQueries();
    }
  }, [status, router]);

  const fetchQueries = async () => {
    try {
      const response = await fetch("/api/queries");
      if (response.ok) {
        const data = await response.json();
        setQueries(data.queries);
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    }
  };

  const toggleResponse = (queryId: string) => {
    setExpandedQuery(expandedQuery === queryId ? null : queryId);
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profile</h2>
          <Link
            href="/"
            className="px-6 py-3 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
          >
            Ask a Question
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-4">
            <p className="text-gray-600">Name: {session?.user?.name}</p>
            <p className="text-gray-600">Email: {session?.user?.email}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Your Past Queries</h3>
          {queries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No queries yet</p>
              <Link
                href="/"
                className="text-teal-500 hover:text-teal-600 underline"
              >
                Start asking questions
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {queries.map((query) => (
                <li
                  key={query.id}
                  className="border rounded-lg p-4 hover:border-teal-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-grow">
                      <p className="text-gray-800 font-medium">{query.text}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(query.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleResponse(query.id)}
                      className="ml-4 text-teal-500 hover:text-teal-600"
                    >
                      {expandedQuery === query.id ? "Hide" : "Show"} Response
                    </button>
                  </div>
                  {expandedQuery === query.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <pre className="whitespace-pre-wrap text-gray-700 font-normal">
                        {query.response}
                      </pre>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
