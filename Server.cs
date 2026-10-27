using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Collections.Generic;

class Server {
    static string baseDir = @"s:\Fashion_App";
    static Dictionary<string, string> mime = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
        { ".html", "text/html; charset=utf-8" },
        { ".css", "text/css; charset=utf-8" },
        { ".js", "application/javascript; charset=utf-8" },
        { ".json", "application/json; charset=utf-8" },
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".png", "image/png" },
        { ".svg", "image/svg+xml" },
        { ".webp", "image/webp" },
        { ".ico", "image/x-icon" },
        { ".woff", "font/woff" },
        { ".woff2", "font/woff2" }
    };

    static void Main() {
        int port = 5050;
        try {
            TcpListener listener = new TcpListener(IPAddress.Any, port);
            listener.Start();
            Console.WriteLine("Server running on http://localhost:" + port);

            while (true) {
                try {
                    TcpClient client = listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(Handle, client);
                } catch (Exception ex) {
                    Console.WriteLine("Accept error: " + ex.Message);
                }
            }
        } catch (Exception ex) {
            Console.WriteLine("Start error: " + ex.ToString());
        }
    }

    static void Handle(object obj) {
        TcpClient client = (TcpClient)obj;
        using (client) {
            client.ReceiveTimeout = 4000;
            client.SendTimeout = 4000;
            try {
                NetworkStream stream = client.GetStream();
                byte[] buf = new byte[8192];
                int n = stream.Read(buf, 0, buf.Length);
                if (n <= 0) return;

                string req = Encoding.UTF8.GetString(buf, 0, n);
                string[] lines = req.Split(new string[] { "\r\n", "\n" }, StringSplitOptions.None);
                if (lines.Length == 0) return;

                string[] parts = lines[0].Split(' ');
                if (parts.Length < 2) return;

                string url = parts[1];
                int q = url.IndexOf('?');
                if (q >= 0) url = url.Substring(0, q);
                if (url == "/" || string.IsNullOrEmpty(url)) url = "/index.html";

                string rel = Uri.UnescapeDataString(url.TrimStart('/')).Replace('/', Path.DirectorySeparatorChar);
                string path = Path.Combine(baseDir, rel);

                if (File.Exists(path)) {
                    string ext = Path.GetExtension(path);
                    string ctype = mime.ContainsKey(ext) ? mime[ext] : "application/octet-stream";
                    byte[] data = File.ReadAllBytes(path);

                    string header = "HTTP/1.1 200 OK\r\n" +
                                    "Content-Type: " + ctype + "\r\n" +
                                    "Content-Length: " + data.Length + "\r\n" +
                                    "Access-Control-Allow-Origin: *\r\n" +
                                    "Connection: close\r\n\r\n";
                    byte[] hBytes = Encoding.ASCII.GetBytes(header);
                    stream.Write(hBytes, 0, hBytes.Length);
                    stream.Write(data, 0, data.Length);
                    stream.Flush();
                } else {
                    string nf = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found";
                    byte[] nfBytes = Encoding.ASCII.GetBytes(nf);
                    stream.Write(nfBytes, 0, nfBytes.Length);
                    stream.Flush();
                }
            } catch {
            }
        }
    }
}
