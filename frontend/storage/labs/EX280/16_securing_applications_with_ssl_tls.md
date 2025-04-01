# Securing Applications with SSL/TLS

**Question**: Secure an application with SSL/TLS for HTTPS on a route.

**Answer**:  
1. **Generate Certs**:  
   ```bash
   openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out cert.pem
   ```  
2. **Create Secret**:  
   ```bash
   oc create secret tls my-tls-secret --cert=cert.pem --key=key.pem --namespace=<namespace>
   ```  
3. **Route**:  
   ```bash
   oc create route edge my-route --service=my-service --cert=cert.pem --key=key.pem
   ```

**Additional Notes**:  
- Use CA-signed certs in production.  
- Test with `curl`.
