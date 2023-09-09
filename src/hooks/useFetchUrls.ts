import { useState } from "react";
import { readEntry, writeEntry } from "../utils/localStorage-handler";
import { cacheTtlInMillis } from "../utils/Resources";
import axios, { AxiosRequestConfig } from "axios";

/**
 * A custom hook used to fetch data from a batch of urls.
 * The array of urls must be specified when calling the fetchUrlCallback function.
 * If the useCache parameter is set to true (which is the default value),
 * this response is cached in the localStorage by a specific configurable amount of time.
 * @param useCache Optional parameter. Default value is true. When set to true, reads the response of the url from the cache if available.
 * If set to false, it doesn't try to read the response from the cache, and it also doesn't set the response in the cache.
 * @returns the array with the received data, where the order of the data is maintained according to the order of the received urls,
 * the fetch data callback, that when invoked starts the fetch of the data,
 * a flag informing if the fetch has been completed, and an error message, that saves any errors that may occur.
 */
export const useFetchUrls = (useCache: boolean = true) => {
    const [data, setData] = useState<any[]>([]);
    const [fetchCompleted, setFetchCompleted] = useState(false);
    const [errorLoadingData, setErrorLoadingData] = useState("");
    
    const fetchUrlsCallback = async (urls: string[], axiosRequestConfig: AxiosRequestConfig<any> = {}, dataTransformer?: (data: any) => any) => {
        try {
            const axiosInstance = axios.create();

            if (dataTransformer) {
                axiosInstance.interceptors.response.use(
                    (response) => {
                        response.data = dataTransformer(response.data);
                        return response;
                    },
                    (error) => {
                        return Promise.reject(error);
                    }
                );
            }

            const promises = urls.map(url => new Promise(async (resolve, reject) => {
                try {
                    let cachedData;
                    if (useCache && (cachedData = readEntry(url))) {
                        resolve(cachedData);
                    } else {
                        const response = await axiosInstance.get(url, axiosRequestConfig);
                        if (useCache) {
                            writeEntry(url, response.data, cacheTtlInMillis);
                        }
                        resolve(response.data);
                    }
                }
                catch (error) {
                    reject(error);
                }
            }));

            const promiseValues = await Promise.all(promises);
            setData(promiseValues);
        }
        catch(error) {
            setErrorLoadingData(JSON.stringify(error));
        }
        finally{
            setFetchCompleted(true);
        }
    };

    const response: [any[], (urls: string[], axiosRequestConfig?: AxiosRequestConfig<any>, dataTransformer?: (data: any) => any) => Promise<void>, boolean, string] = [data, fetchUrlsCallback, fetchCompleted, errorLoadingData];
    return response;
};