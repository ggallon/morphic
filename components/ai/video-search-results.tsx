/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SerperSearchResultItem, SerperSearchResults } from "@/lib/types";

interface VideoSearchResultsProps {
  results: SerperSearchResults;
}

export function VideoSearchResults({ results }: VideoSearchResultsProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);
  const [count, setCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const videoRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  // filter out the videos that path is not /watch
  const videos = results.videos.filter((video: SerperSearchResultItem) => {
    return new URL(video.link).pathname === "/watch";
  });

  // Update the current and count state when the carousel api is available
  useEffect(() => {
    if (api) {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap() + 1);

      api.on("select", () => {
        const newCurrent = api.selectedScrollSnap() + 1;
        if (newCurrent !== current && videoRefs.current[current - 1]) {
          const prevVideo = videoRefs.current[current - 1];
          prevVideo?.contentWindow?.postMessage(
            '{"event":"command","func":"pauseVideo","args":""}',
            "*",
          );
        }
        setCurrent(newCurrent);
      });
    }
  }, [api, current]);

  // Scroll to the selected index
  useEffect(() => {
    if (api) {
      api.scrollTo(selectedIndex, true);
    }
  }, [api, selectedIndex]);

  if (!results.videos || results.videos.length === 0) {
    return <div className="text-muted-foreground">No videos found</div>;
  }

  return (
    <div className="flex flex-wrap">
      {videos.slice(0, 4).map((result: SerperSearchResultItem, index: any) => (
        <Dialog key={index}>
          <DialogTrigger asChild>
            <div
              className="relative w-1/2 cursor-pointer p-1 md:w-1/4"
              onClick={() => setSelectedIndex(index)}
            >
              <Card className="min-h-40 flex-1">
                <CardContent className="p-2">
                  <img
                    src={result.imageUrl}
                    alt={result.title}
                    className="mb-2 aspect-video w-full"
                    onError={(e) =>
                      (e.currentTarget.src = "/images/placeholder-image.png")
                    }
                  />
                  <p className="line-clamp-2 text-xs">{result.title}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage
                        src={`https://www.google.com/s2/favicons?domain=${
                          new URL(result.link).hostname
                        }`}
                        alt={result.channel}
                      />
                      <AvatarFallback>
                        {new URL(result.link).hostname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate text-xs opacity-60">
                      {new URL(result.link).hostname}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {index === 3 && results.videos.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30 text-sm text-white/80">
                  <PlusCircle size={24} />
                </div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Search Videos</DialogTitle>
              <DialogDescription className="text-sm">
                {results.searchParameters.q}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Carousel
                setApi={setApi}
                className="max-h-[60vh] w-full bg-muted"
              >
                <CarouselContent>
                  {videos.map((video, idx) => {
                    const videoId = video.link.split("v=")[1];
                    return (
                      <CarouselItem key={idx}>
                        <div className="flex h-full items-center justify-center p-1">
                          <iframe
                            ref={(el) => {
                              videoRefs.current[idx] = el;
                            }}
                            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                            className="aspect-video w-full"
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <div className="pointer-events-none absolute inset-8 flex items-center justify-between p-4">
                  <CarouselPrevious className="pointer-events-auto h-10 w-10 rounded-full shadow focus:outline-none">
                    <span className="sr-only">Previous</span>
                  </CarouselPrevious>
                  <CarouselNext className="pointer-events-auto h-10 w-10 rounded-full shadow focus:outline-none">
                    <span className="sr-only">Next</span>
                  </CarouselNext>
                </div>
              </Carousel>
              <div className="py-2">
                <div className="text-center text-sm text-muted-foreground">
                  {current} of {count}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
